import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  User,
  Bot,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ChatMessage } from '../types';

export const ChatAssistantPage: React.FC = () => {
  const { user, preferences, speak, stopSpeaking, isSpeaking, triggerHaptic, announce } =
    useAccessibility();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Hello! I am your AccessNav AI Companion. I can help with disability rights, accessible transit tips, cognitive strategies, sensory accommodations, and assistive tools. How can I support you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const starterChips = [
    'What are my rights under ADA for service animals?',
    'How do I request wheelchair assistance on trains & flights?',
    'Tips to de-escalate sensory overload in a mall',
    'Explain how to use voiceover and talkback gestures',
  ];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    triggerHaptic('click');
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    announce('AccessNav AI is generating response...', 'polite');

    try {
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          language: preferences.language,
          userPreferences: {
            disabilities: preferences.disabilityTypes,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Chat failed.');
      }

      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: json.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      triggerHaptic('success');
      announce('Response received. You can press Read Aloud to listen.', 'polite');
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'model',
        content: 'I apologize, but I could not connect. Please check your internet connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleMicInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      announce('Speech recognition not supported on this device', 'assertive');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      triggerHaptic('click');
      announce('Listening for your chat question...', 'polite');
    };
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      announce(`Captured: ${text}`, 'polite');
    };
    recognition.start();
  };

  const handleCopy = (id: string, text: string) => {
    triggerHaptic('click');
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    announce('Message copied', 'polite');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-8rem)]">
      {/* Title */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-indigo-600 dark:text-yellow-400" />
            <span>Accessibility Chat Companion</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-0.5">
            Ask questions about disability rights, transit accommodations, and assistive tools.
          </p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('click');
            setMessages([messages[0]]);
          }}
          className="text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white flex items-center gap-1 p-2"
          aria-label="Clear chat history"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-4 sm:p-6 shadow-sm overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold opacity-60 mb-1">
                  <span>{isUser ? 'You' : 'AccessNav Companion'}</span>
                  <span>{m.timestamp}</span>
                </div>

                <div className="whitespace-pre-line">{m.content}</div>

                {/* Message action buttons */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center gap-3 text-xs">
                    <button
                      onClick={() => speak(m.content)}
                      className="hover:underline flex items-center gap-1 font-bold text-indigo-700 dark:text-yellow-400"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Read Aloud</span>
                    </button>
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:underline flex items-center gap-1 text-neutral-600 dark:text-neutral-400 font-medium"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-500 animate-pulse flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>AccessNav Companion is typing advice...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Chips */}
      <div className="shrink-0 flex flex-wrap gap-2">
        {starterChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-300 dark:border-neutral-700"
          >
            "{chip}"
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="shrink-0 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about accommodations, sensory tips, transit, or rights..."
            className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-2xl text-neutral-900 dark:text-white font-medium text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={handleMicInput}
            className="touch-target absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-black dark:hover:text-white rounded-xl"
            aria-label="Speak question using microphone"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="touch-target px-5 py-3.5 bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm rounded-2xl flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
