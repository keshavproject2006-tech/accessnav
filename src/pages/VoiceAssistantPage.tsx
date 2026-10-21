import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  SunMoon,
  Compass,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const VoiceAssistantPage: React.FC = () => {
  const {
    speak,
    stopSpeaking,
    isSpeaking,
    setActiveTab,
    updatePreferences,
    preferences,
    triggerHaptic,
    announce,
  } = useAccessibility();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: 'Hello! I am your hands-free voice navigator. Press the large microphone button and speak your request.',
    },
  ]);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = preferences.language === 'en' ? 'en-US' : preferences.language;

        recognition.onstart = () => {
          setIsListening(true);
          triggerHaptic('click');
          announce('Listening. Please speak now.', 'polite');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            setTranscript(final);
            setInterimTranscript('');
            handleProcessVoice(final);
          } else {
            setInterimTranscript(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            announce('Microphone access was denied. Please allow microphone permissions.', 'assertive');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [preferences.language]);

  const startListening = () => {
    stopSpeaking();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already active
      }
    } else {
      announce('Speech recognition is not supported in this browser. You can type commands below.', 'assertive');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleProcessVoice = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;

    // Add user message to history
    setHistory((prev) => [...prev, { sender: 'user', text: textToProcess }]);
    setLoading(true);
    announce('Processing your voice request...', 'polite');

    try {
      const res = await fetch('/api/gemini/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: textToProcess,
          language: preferences.language,
        }),
      });

      const json = await res.json();
      const data = json.data;
      const spoken = data?.spokenResponse || data?.textResponse || 'I have completed your request.';
      const detailedText = data?.textResponse || spoken;

      setAiResponse(detailedText);
      setHistory((prev) => [...prev, { sender: 'assistant', text: detailedText }]);

      // Speak answer out loud
      speak(spoken, () => {
        // If this was a navigation command to another screen, switch after speaking
        if (data?.targetFeature && data.targetFeature !== 'home' && data.targetFeature !== 'voice') {
          setActiveTab(data.targetFeature as any);
        }
      });

      // Handle direct actions like High Contrast
      if (data?.actionTriggered === 'TOGGLE_HIGH_CONTRAST') {
        updatePreferences({
          highContrast: !preferences.highContrast,
          theme: !preferences.highContrast ? 'high-contrast' : 'light',
        });
      } else if (data?.actionTriggered === 'EMERGENCY_ALERT') {
        setActiveTab('emergency');
      }
    } catch (err) {
      const fallback = 'I had trouble connecting. You can try repeating or tapping the navigation options.';
      setAiResponse(fallback);
      speak(fallback);
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { label: "Describe what's around me", action: () => handleProcessVoice("Describe what's around me") },
    { label: "Find wheelchair ramp or elevator", action: () => handleProcessVoice("I need to find an accessible elevator") },
    { label: "Read a sign or label", action: () => handleProcessVoice("Read this sign or label") },
    { label: "Toggle high contrast", action: () => handleProcessVoice("Toggle high contrast mode") },
    { label: "Show emergency contact", action: () => handleProcessVoice("Show emergency contact") },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Title */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center justify-center sm:justify-start gap-2.5">
          <Mic className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          <span>Hands-Free Voice Assistant</span>
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
          Press the microphone and speak naturally. Say commands like "Navigate to elevator" or ask any accessibility question.
        </p>
      </div>

      {/* Giant Push-To-Talk Button Section */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-8 sm:p-12 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Animated Listening Halo */}
        {isListening && (
          <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-emerald-500/20 animate-ping -z-0"></div>
        )}

        <button
          onClick={isListening ? stopListening : startListening}
          className={`touch-target w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center gap-2 border-4 transition-all z-10 shadow-2xl active:scale-95 ${
            isListening
              ? 'bg-emerald-600 text-white border-emerald-400 ring-8 ring-emerald-500/30'
              : 'bg-black dark:bg-white text-white dark:text-black border-neutral-800 dark:border-neutral-300 hover:scale-105'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start voice recognition. Push to talk.'}
          aria-pressed={isListening}
        >
          {isListening ? (
            <>
              <MicOff className="w-12 h-12 animate-pulse" />
              <span className="font-extrabold text-xs uppercase tracking-widest">Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-12 h-12" />
              <span className="font-extrabold text-xs uppercase tracking-widest">Push to Talk</span>
            </>
          )}
        </button>

        {/* Live speech feedback text */}
        <div className="mt-6 min-h-[3rem] flex items-center justify-center">
          {interimTranscript ? (
            <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
              "{interimTranscript}"
            </p>
          ) : isListening ? (
            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              Go ahead, I am listening...
            </p>
          ) : loading ? (
            <p className="text-sm font-bold text-blue-600 dark:text-yellow-400 animate-pulse">
              Gemini is thinking...
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Tap the button above and speak your command
            </p>
          )}
        </div>

        {/* Audio Mute/Stop button if currently speaking */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <VolumeX className="w-4 h-4" />
            <span>Stop Speaking Audio</span>
          </button>
        )}
      </div>

      {/* Quick Suggested Voice Commands */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
          Or tap a common command:
        </h2>
        <div className="flex flex-wrap gap-2">
          {quickCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('click');
                cmd.action();
              }}
              className="touch-target px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-xs font-bold border border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm"
            >
              "{cmd.label}"
            </button>
          ))}
        </div>
      </div>

      {/* Voice Conversation History Log */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">
            Spoken Conversation Log
          </h3>
          <button
            onClick={() => {
              triggerHaptic('click');
              setHistory([]);
            }}
            className="text-xs text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {history.map((msg, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white ml-8 font-semibold border border-neutral-300 dark:border-neutral-700'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 mr-8 border border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-neutral-500 mb-1">
                <span>{msg.sender === 'user' ? 'You Spoke' : 'AccessNav Voice'}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => speak(msg.text)}
                    className="hover:underline flex items-center gap-1 text-emerald-700 dark:text-emerald-300"
                    title="Speak this response again"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>
                )}
              </div>
              <p>{msg.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
