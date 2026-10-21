import React, { useState } from 'react';
import {
  Settings,
  Type,
  SunMoon,
  Sparkles,
  Volume2,
  Globe,
  Sliders,
  Check,
  Smartphone,
  Shield,
  Eye,
  LogOut,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { AppTheme, ColorBlindMode, SupportedLanguage } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    user,
    preferences,
    updatePreferences,
    signOutUser,
    speak,
    availableVoices,
    triggerHaptic,
    announce,
    t,
  } = useAccessibility();

  const [savedStatus, setSavedStatus] = useState(false);

  const handleUpdate = async (partial: any) => {
    triggerHaptic('click');
    await updatePreferences(partial);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
    announce('Settings updated and saved.', 'polite');
  };

  const testTTS = () => {
    triggerHaptic('click');
    speak(
      `This is a test of your text-to-speech settings at ${preferences.ttsSpeed || 1.0} times normal speed.`
    );
  };

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'es', label: 'Spanish', native: 'Español' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'fr', label: 'French', native: 'Français' },
    { code: 'ar', label: 'Arabic', native: 'العربية' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-neutral-800 dark:text-yellow-400" />
            <span>Accessibility Settings</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 mt-1">
            Personalize your viewing, navigation, auditory, and cognitive experience. Changes apply immediately.
          </p>
        </div>

        {savedStatus && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 text-xs font-bold animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Saved to your profile</span>
          </span>
        )}
      </div>

      {/* Live Preview Card */}
      <div className="p-5 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl shadow-sm space-y-2">
        <span className="text-[11px] uppercase font-bold text-neutral-500 tracking-wider">
          Live Preview of Current Typography & Contrast
        </span>
        <div className="p-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-300 dark:border-neutral-700">
          <p className="font-bold text-base sm:text-lg mb-1 text-neutral-900 dark:text-white">
            AccessNav: Clear, accessible guidance everywhere you navigate.
          </p>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            This preview reflects your chosen text size ({preferences.fontSize}%), contrast mode, and font family.
          </p>
        </div>
      </div>

      {/* Section 1: Typography & Sizing */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Type className="w-5 h-5" />
          <span>Visual & Reading Adjustments</span>
        </h2>

        {/* Font Size Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-white">
            <span>Font Size Scale:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-extrabold text-xs">
              {preferences.fontSize}%
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={200}
            step={10}
            value={preferences.fontSize || 100}
            onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })}
            className="w-full accent-black dark:accent-yellow-400 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            aria-label="Adjust app font size scale between 100% and 200%"
          />
          <div className="flex justify-between text-[11px] font-bold text-neutral-500">
            <span>Standard (100%)</span>
            <span>Large (150%)</span>
            <span>Maximum (200%)</span>
          </div>
        </div>

        {/* Theme and Contrast Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Theme & Contrast:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light Theme', desc: 'Standard high-clarity white' },
              { id: 'dark', label: 'Dark Theme', desc: 'Reduced glare for low light' },
              { id: 'high-contrast', label: 'High Contrast (Pure Black)', desc: '7:1+ contrast with bold yellow' },
            ].map((th) => {
              const isSelected =
                th.id === 'high-contrast'
                  ? preferences.highContrast || preferences.theme === 'high-contrast'
                  : preferences.theme === th.id && !preferences.highContrast;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() =>
                    handleUpdate({
                      theme: th.id as AppTheme,
                      highContrast: th.id === 'high-contrast',
                    })
                  }
                  className={`touch-target p-3.5 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black shadow'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="font-bold text-sm">{th.label}</div>
                  <div
                    className={`text-[11px] mt-1 ${
                      isSelected
                        ? 'text-neutral-300 dark:text-neutral-700'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {th.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dyslexia & Motion Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dyslexiaFont}
              onChange={(e) => handleUpdate({ dyslexiaFont: e.target.checked })}
              className="w-5 h-5 mt-0.5 accent-black dark:accent-yellow-400 rounded"
            />
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-white">
                Dyslexia-Friendly Font
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Applies Atkinson Hyperlegible and increased letter/word spacing for easier character distinction.
              </p>
            </div>
          </label>

          <label className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.reducedMotion}
              onChange={(e) => handleUpdate({ reducedMotion: e.target.checked })}
              className="w-5 h-5 mt-0.5 accent-black dark:accent-yellow-400 rounded"
            />
            <div>
              <div className="font-bold text-sm text-neutral-900 dark:text-white">
                Reduce Motion & Animations
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Stops smooth scrolling, screen sliding, and pulsating effects to prevent dizziness or sensory discomfort.
              </p>
            </div>
          </label>
        </div>

        {/* Color Blind Mode */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Color-Blindness Palette Adjustment:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'none', label: 'Standard' },
              { id: 'protanopia', label: 'Protanopia' },
              { id: 'deuteranopia', label: 'Deuteranopia' },
              { id: 'tritanopia', label: 'Tritanopia' },
              { id: 'monochrome', label: 'Monochrome' },
            ].map((cb) => (
              <button
                key={cb.id}
                type="button"
                onClick={() => handleUpdate({ colorBlindMode: cb.id as ColorBlindMode })}
                className={`touch-target p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  preferences.colorBlindMode === cb.id
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                {cb.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Audio & Speech Settings */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Volume2 className="w-5 h-5" />
          <span>Speech Synthesis & Audio</span>
        </h2>

        {/* Speech Speed */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-bold text-neutral-900 dark:text-white">
            <span>Text-to-Speech Speed:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-extrabold text-xs">
              {preferences.ttsSpeed}x
            </span>
          </div>
          <input
            type="range"
            min={0.7}
            max={1.8}
            step={0.1}
            value={preferences.ttsSpeed || 1.0}
            onChange={(e) => handleUpdate({ ttsSpeed: Number(e.target.value) })}
            className="w-full accent-black dark:accent-yellow-400 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
            aria-label="Adjust TTS speech rate"
          />
          <div className="flex justify-between text-[11px] font-bold text-neutral-500">
            <span>Slower (0.7x)</span>
            <span>Normal (1.0x)</span>
            <span>Faster (1.8x)</span>
          </div>
        </div>

        {/* Voice Selection */}
        {availableVoices.length > 0 && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-2">
              Select Spoken Voice:
            </label>
            <select
              value={preferences.ttsVoice || ''}
              onChange={(e) => handleUpdate({ ttsVoice: e.target.value })}
              className="w-full p-3 bg-neutral-50 dark:bg-neutral-800 border-2 border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white"
            >
              <option value="">Default System Voice</option>
              {availableVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Voice Test & Haptics */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={testTTS}
            className="touch-target px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 rounded-xl text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2 border border-neutral-300 dark:border-neutral-700"
          >
            <Volume2 className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
            <span>Test Voice & Speed</span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200">
            <input
              type="checkbox"
              checked={preferences.hapticFeedback}
              onChange={(e) => handleUpdate({ hapticFeedback: e.target.checked })}
              className="w-5 h-5 accent-black dark:accent-yellow-400 rounded"
            />
            <span>Vibration Haptics (Mobile)</span>
          </label>
        </div>
      </div>

      {/* Section 3: Language Selection */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Globe className="w-5 h-5" />
          <span>Language (Multi-Language Support)</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => handleUpdate({ language: l.code })}
              className={`touch-target p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                preferences.language === l.code
                  ? 'bg-black text-white dark:bg-white dark:text-black font-extrabold border-transparent'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <div>
                <div className="text-sm font-bold">{l.label}</div>
                <div className="text-xs opacity-70">{l.native}</div>
              </div>
              {preferences.language === l.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>

      {/* Section 4: Account & Privacy */}
      <div className="bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <Shield className="w-5 h-5" />
          <span>Account & Privacy</span>
        </h2>

        <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          <p>
            • Logged in as: <strong>{user?.isGuest ? 'Guest Explorer' : user?.email || 'User'}</strong>
          </p>
          <p>
            • Session Mode: {user?.isGuest ? 'Local Device Storage' : 'Firebase Firestore Cloud Synchronization'}
          </p>
          <p>
            • Privacy: Camera, microphone, and geolocation are accessed only on your command. Images are analyzed via server-side Gemini 2.5 API and discarded immediately.
          </p>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={signOutUser}
            className="touch-target px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
