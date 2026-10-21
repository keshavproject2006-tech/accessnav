import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Captions,
  Mic,
  MicOff,
  Copy,
  Download,
  Trash2,
  Check,
  Type,
  Palette,
  Pause,
  Play,
  Globe,
  AlertCircle,
  Save,
  Volume2,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { saveHistoryItem } from '../lib/firebase';

interface IndianLanguageOption {
  code: string;
  name: string;
  native: string;
  samplePhrase: string;
}

const INDIAN_LANGUAGES: IndianLanguageOption[] = [
  { code: 'ta-IN', name: 'Tamil', native: 'தமிழ்', samplePhrase: 'வணக்கம், நான் இப்போது பேசுகிறேன் (Welcome, speaking in Tamil)' },
  { code: 'hi-IN', name: 'Hindi', native: 'हिन्दी', samplePhrase: 'नमस्ते, लाइव कैप्शन सक्रिय है (Namaste, Live captions active)' },
  { code: 'te-IN', name: 'Telugu', native: 'తెలుగు', samplePhrase: 'నమస్కారం, క్యాప్షన్లు సిద్ధంగా ఉన్నాయి (Greetings, captions ready)' },
  { code: 'kn-IN', name: 'Kannada', native: 'ಕನ್ನಡ', samplePhrase: 'ನಮಸ್ಕಾರ, ನಾನು ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ (Hello, speaking in Kannada)' },
  { code: 'ml-IN', name: 'Malayalam', native: 'മലയാളം', samplePhrase: 'നമസ്കാരം, തത്സമയ അടിക്കുറിപ്പുകൾ (Greetings, live captions)' },
  { code: 'bn-IN', name: 'Bengali', native: 'বাংলা', samplePhrase: 'নমস্কার, লাইভ ক্যাপশন চালু আছে (Hello, live captions active)' },
  { code: 'en-IN', name: 'English (India)', native: 'English', samplePhrase: 'Hello, live speech captions are active' },
];

export const LiveCaptionsPage: React.FC = () => {
  const { user, triggerHaptic, announce, stopSpeaking } = useAccessibility();

  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedLang, setSelectedLang] = useState<IndianLanguageOption>(INDIAN_LANGUAGES[0]); // Tamil default
  const [captionTheme, setCaptionTheme] = useState<'yellow-black' | 'white-black' | 'black-yellow'>('yellow-black');
  const [captionSize, setCaptionSize] = useState<'normal' | 'large' | 'giant'>('large');
  const [segments, setSegments] = useState<Array<{ id: string; text: string; time: string; lang: string }>>([
    {
      id: 'init',
      text: 'நேரலை தலைப்புகள் தயார் (Live captions ready). Press "Start Captions" and speak.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: 'ta-IN',
    },
  ]);
  const [interimText, setInterimText] = useState('');
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isCapturingRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<any>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [stopSpeaking]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  // Scroll to bottom when new words arrive
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments, interimText]);

  // Clean up any pending restart timeouts
  const clearRestartTimer = () => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  const stopListening = useCallback(() => {
    clearRestartTimer();
    isCapturingRef.current = false;
    setIsCapturing(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
  }, []);

  const createRecognition = useCallback(
    (langCode: string) => {
      if (typeof window === 'undefined') return null;
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return null;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langCode;

        recognition.onstart = () => {
          setMicPermissionError(null);
          announce(`Captions active in ${selectedLang.name}`, 'polite');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              const cleaned = transcript.trim();
              if (cleaned) {
                const newSeg = {
                  id: Math.random().toString(36).substring(2, 9),
                  text: cleaned,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  lang: langCode,
                };
                setSegments((prev) => [...prev, newSeg]);
                setInterimText('');
                triggerHaptic('click');
              }
            } else {
              interim += transcript;
            }
          }
          if (interim) {
            setInterimText(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setMicPermissionError('Microphone permission denied. Please allow microphone access in your browser settings.');
            stopListening();
          } else if (event.error === 'no-speech') {
            // Normal pause in speech, will restart automatically
          }
        };

        recognition.onend = () => {
          // Mobile auto-restart if user still wants capturing
          if (isCapturingRef.current) {
            clearRestartTimer();
            restartTimeoutRef.current = setTimeout(() => {
              if (isCapturingRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  // If recognition instance is dead, recreate it
                  const newRec = createRecognition(selectedLang.code);
                  if (newRec) {
                    recognitionRef.current = newRec;
                    try {
                      newRec.start();
                    } catch {}
                  }
                }
              }
            }, 250);
          }
        };

        return recognition;
      } catch (err) {
        console.warn('Failed to construct SpeechRecognition:', err);
        return null;
      }
    },
    [selectedLang, announce, triggerHaptic, stopListening]
  );

  const startCaptions = async () => {
    triggerHaptic('click');
    setMicPermissionError(null);

    // 1. Explicitly request microphone stream on mobile to wake up hardware
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Release tracks right away, SpeechRecognition will take over the mic session
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.warn('Microphone permission request error:', err);
        setMicPermissionError('Please allow microphone permissions to transcribe live speech.');
        return;
      }
    }

    // 2. Start recognition
    stopListening();
    const rec = createRecognition(selectedLang.code);
    if (!rec) {
      setIsSupported(false);
      setMicPermissionError('Speech recognition is not supported on this browser.');
      return;
    }

    recognitionRef.current = rec;
    isCapturingRef.current = true;
    setIsCapturing(true);

    try {
      rec.start();
    } catch (e) {
      console.warn('Could not start recognition:', e);
    }
  };

  const toggleCaptions = () => {
    if (isCapturing) {
      stopListening();
      announce('Captions paused', 'polite');
    } else {
      startCaptions();
    }
  };

  const handleLanguageChange = (lang: IndianLanguageOption) => {
    triggerHaptic('click');
    setSelectedLang(lang);
    announce(`Language switched to ${lang.name} (${lang.native})`, 'polite');

    // If currently running, restart with new language
    if (isCapturingRef.current) {
      stopListening();
      setTimeout(() => {
        const rec = createRecognition(lang.code);
        if (rec) {
          recognitionRef.current = rec;
          isCapturingRef.current = true;
          setIsCapturing(true);
          try {
            rec.start();
          } catch {}
        }
      }, 300);
    }
  };

  const addManualSample = (phrase: string) => {
    triggerHaptic('click');
    const newSeg = {
      id: Math.random().toString(36).substring(2, 9),
      text: phrase,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: selectedLang.code,
    };
    setSegments((prev) => [...prev, newSeg]);
  };

  const handleCopy = () => {
    triggerHaptic('click');
    const full = segments.map((s) => `[${s.time}] ${s.text}`).join('\n');
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    announce('Transcript copied to clipboard', 'polite');
  };

  const handleSave = () => {
    triggerHaptic('success');
    const full = segments.map((s) => `[${s.time}] ${s.text}`).join('\n');
    if (user) {
      saveHistoryItem(user.uid, {
        type: 'live_captions',
        title: `Live Captions (${selectedLang.name}) - ${new Date().toLocaleDateString()}`,
        content: full,
      });
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
    announce('Transcript saved to profile', 'polite');
  };

  // Theme styling
  let containerStyle = 'bg-black text-yellow-400 border-neutral-800';
  if (captionTheme === 'white-black') {
    containerStyle = 'bg-black text-white border-neutral-800';
  } else if (captionTheme === 'black-yellow') {
    containerStyle = 'bg-yellow-400 text-black border-yellow-500 font-bold';
  }

  // Size styling
  let sizeStyle = 'text-lg sm:text-xl leading-relaxed';
  if (captionSize === 'large') {
    sizeStyle = 'text-2xl sm:text-3xl leading-relaxed font-bold';
  } else if (captionSize === 'giant') {
    sizeStyle = 'text-3xl sm:text-5xl leading-tight font-extrabold';
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Captions className="w-7 h-7 text-rose-600 dark:text-yellow-400" />
            <span>Live Speech Captions</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Real-time speech-to-text subtitles supporting Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali & English.
          </p>
        </div>

        {/* Start / Stop Main CTA */}
        <button
          onClick={toggleCaptions}
          className={`touch-target px-6 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 transition-all shadow-lg active:scale-95 ${
            isCapturing
              ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/30'
              : 'bg-black dark:bg-white text-white dark:text-black hover:scale-102'
          }`}
          aria-label={isCapturing ? 'Pause captions' : 'Start live captions'}
        >
          {isCapturing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{isCapturing ? 'Pause Captions' : 'Start Captions'}</span>
        </button>
      </div>

      {/* 6 Indian Languages Selector Bar */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Speech Language:
          </span>
          <span className="text-neutral-900 dark:text-white lowercase">
            ({selectedLang.name} - {selectedLang.code})
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = selectedLang.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang)}
                className={`touch-target px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200'
                }`}
              >
                <span>{lang.native}</span>
                <span className="text-[11px] opacity-75">({lang.name})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Microphone status or permission errors */}
      {micPermissionError && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-500 rounded-xl text-xs sm:text-sm text-red-700 dark:text-red-300 font-semibold flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <span>{micPermissionError}</span>
            <div className="pt-1">
              <button
                onClick={startCaptions}
                className="underline font-bold text-red-800 dark:text-red-200 hover:opacity-80"
              >
                Tap here to retry microphone permission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caption Viewport Controls: Size & High Contrast Palette */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Size */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-neutral-500 uppercase">Size:</span>
          {(['normal', 'large', 'giant'] as const).map((sz) => (
            <button
              key={sz}
              onClick={() => {
                triggerHaptic('click');
                setCaptionSize(sz);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                captionSize === sz
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>

        {/* Theme */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-neutral-500 uppercase">Contrast:</span>
          <button
            onClick={() => setCaptionTheme('yellow-black')}
            className={`px-2.5 py-1 rounded-lg font-bold bg-black text-yellow-400 border ${
              captionTheme === 'yellow-black' ? 'ring-2 ring-blue-500' : 'border-neutral-700'
            }`}
          >
            Yellow
          </button>
          <button
            onClick={() => setCaptionTheme('white-black')}
            className={`px-2.5 py-1 rounded-lg font-bold bg-black text-white border ${
              captionTheme === 'white-black' ? 'ring-2 ring-blue-500' : 'border-neutral-700'
            }`}
          >
            White
          </button>
          <button
            onClick={() => setCaptionTheme('black-yellow')}
            className={`px-2.5 py-1 rounded-lg font-bold bg-yellow-400 text-black border ${
              captionTheme === 'black-yellow' ? 'ring-2 ring-blue-500' : 'border-yellow-500'
            }`}
          >
            Hi-Vis
          </button>
        </div>

        {/* Mic Pulse Indicator */}
        <div className="flex items-center gap-2 ml-auto">
          {isCapturing ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Transcribing ({selectedLang.native})</span>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 font-semibold">Captions Idle</div>
          )}
        </div>
      </div>

      {/* Main High-Legibility Live Caption Display */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Live captions stream"
        className={`w-full min-h-[340px] max-h-[500px] overflow-y-auto p-5 sm:p-7 rounded-2xl border-4 shadow-xl flex flex-col justify-start transition-all ${containerStyle}`}
      >
        <div className="space-y-4">
          {segments.map((seg) => (
            <div key={seg.id}>
              <span className="text-[10px] font-mono opacity-50 block mb-0.5">
                {seg.time}
              </span>
              <p className={sizeStyle}>{seg.text}</p>
            </div>
          ))}

          {/* Real-time in-flight speech */}
          {interimText && (
            <div className="opacity-80 italic animate-pulse">
              <span className="text-[10px] font-mono opacity-50 block mb-0.5">Speaking...</span>
              <p className={sizeStyle}>{interimText}</p>
            </div>
          )}
        </div>
        <div ref={scrollEndRef} />
      </div>

      {/* Quick Test Sentence Trigger for Testing */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>Test sentence:</span>
        <button
          onClick={() => addManualSample(selectedLang.samplePhrase)}
          className="underline hover:text-black dark:hover:text-white font-medium"
        >
          Add sample {selectedLang.name} phrase ("{selectedLang.native}")
        </button>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="touch-target px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy All'}</span>
          </button>

          <button
            onClick={handleSave}
            className="touch-target px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-neutral-300 dark:border-neutral-700 shadow-sm"
          >
            {savedNotice ? <Check className="w-4 h-4 text-green-600" /> : <Save className="w-4 h-4" />}
            <span>{savedNotice ? 'Saved!' : 'Save Transcript'}</span>
          </button>
        </div>

        <button
          onClick={() => {
            triggerHaptic('click');
            setSegments([]);
            setInterimText('');
          }}
          className="text-xs text-neutral-500 hover:text-red-600 flex items-center gap-1 font-semibold p-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Screen</span>
        </button>
      </div>
    </div>
  );
};
