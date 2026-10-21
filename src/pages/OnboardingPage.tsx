import React, { useState } from 'react';
import {
  Eye,
  Ear,
  Accessibility,
  Brain,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
  Volume2,
  ShieldAlert,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { DisabilityType, UserPreferences } from '../types';

export const OnboardingPage: React.FC = () => {
  const { preferences, completeOnboarding, speak, t, triggerHaptic, announce } = useAccessibility();

  const [selectedDisabilities, setSelectedDisabilities] = useState<DisabilityType[]>(
    preferences.disabilityTypes || []
  );
  const [fontSize, setFontSize] = useState<number>(preferences.fontSize || 120);
  const [highContrast, setHighContrast] = useState<boolean>(preferences.highContrast || false);
  const [dyslexiaFont, setDyslexiaFont] = useState<boolean>(preferences.dyslexiaFont || false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(preferences.reducedMotion || false);
  const [emergencyName, setEmergencyName] = useState<string>(preferences.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState<string>(preferences.emergencyContactPhone || '');
  const [emergencyNotes, setEmergencyNotes] = useState<string>(preferences.emergencyMedicalNotes || '');

  const disabilityOptions: {
    id: DisabilityType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'visual',
      label: 'Visual / Low Vision / Blind',
      description: 'Camera scene describer, audio read-aloud, high contrast, tactile cues',
      icon: Eye,
    },
    {
      id: 'hearing',
      label: 'Deaf / Hard of Hearing',
      description: 'Real-time live captions, visual hazard alerts, vibration haptics',
      icon: Ear,
    },
    {
      id: 'mobility',
      label: 'Motor / Wheelchair / Dexterity',
      description: 'Step-free navigation, ramps, elevators, hands-free voice commands, large touch targets',
      icon: Accessibility,
    },
    {
      id: 'cognitive',
      label: 'Cognitive / Dyslexia / ADHD',
      description: 'Plain language text simplifier, dyslexia-friendly font, reduced distractions',
      icon: Brain,
    },
    {
      id: 'speech',
      label: 'Speech / Non-Verbal',
      description: 'One-tap text-to-speech phrases to communicate with transit and emergency staff',
      icon: MessageSquare,
    },
  ];

  const toggleDisability = (id: DisabilityType) => {
    triggerHaptic('click');
    let next: DisabilityType[];
    if (selectedDisabilities.includes(id)) {
      next = selectedDisabilities.filter((d) => d !== id);
    } else {
      next = [...selectedDisabilities, id];

      // Auto-tune defaults for a better experience
      if (id === 'visual') {
        setFontSize(140);
        setHighContrast(true);
      }
      if (id === 'cognitive') {
        setDyslexiaFont(true);
        setReducedMotion(true);
      }
    }
    setSelectedDisabilities(next);
    announce(`Updated selection for ${id}`);
  };

  const testVoice = () => {
    triggerHaptic('click');
    speak('Welcome to AccessNav. Audio speech is working loud and clear.');
  };

  const handleFinish = async () => {
    triggerHaptic('success');
    const updated: Partial<UserPreferences> = {
      disabilityTypes: selectedDisabilities,
      fontSize,
      highContrast,
      theme: highContrast ? 'high-contrast' : 'light',
      dyslexiaFont,
      reducedMotion,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
      emergencyMedicalNotes: emergencyNotes,
    };
    await completeOnboarding(updated);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome Setup</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            How can AccessNav best assist you?
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 font-medium">
            Select any needs that apply. We will optimize navigation, display sizes, and speech audio.
          </p>
        </div>

        {/* Step 1: Select Needs */}
        <div className="space-y-3 mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Select your preferences (you can pick multiple):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {disabilityOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedDisabilities.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleDisability(opt.id)}
                  className={`touch-target p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'border-black dark:border-white bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-900 dark:text-white'
                  }`}
                  aria-pressed={isSelected}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white text-black dark:bg-black dark:text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm leading-tight flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 ml-1" />}
                    </div>
                    <div
                      className={`text-xs mt-1 leading-snug line-clamp-2 ${
                        isSelected ? 'text-neutral-300 dark:text-neutral-700' : 'text-neutral-500 dark:text-neutral-400'
                      }`}
                    >
                      {opt.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Immediate Display Adjustments */}
        <div className="p-5 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl border border-neutral-300 dark:border-neutral-700 space-y-5 mb-8">
          <div className="font-bold text-sm text-neutral-900 dark:text-white">
            Quick Display & Voice Tuning
          </div>

          {/* Text Size Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-neutral-700 dark:text-neutral-300">
              <span>Text Size</span>
              <span>{fontSize}%</span>
            </div>
            <input
              type="range"
              min={100}
              max={180}
              step={10}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-black dark:accent-white h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg cursor-pointer"
              aria-label="Adjust font scale percentage"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-5 h-5 accent-black dark:accent-yellow-400 rounded"
              />
              <span>High Contrast</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={dyslexiaFont}
                onChange={(e) => setDyslexiaFont(e.target.checked)}
                className="w-5 h-5 accent-black dark:accent-white rounded"
              />
              <span>Dyslexia Font</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-5 h-5 accent-black dark:accent-white rounded"
              />
              <span>Reduce Motion</span>
            </label>
          </div>

          {/* Voice Speech Test */}
          <div className="pt-2 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Test Spoken Speech Feedback:
            </span>
            <button
              type="button"
              onClick={testVoice}
              className="touch-target px-3 py-1.5 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 shadow-sm hover:bg-neutral-100"
            >
              <Volume2 className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
              <span>Test Audio</span>
            </button>
          </div>
        </div>

        {/* Step 3: Optional Emergency Contact */}
        <div className="p-5 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/60 mb-8 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-400">
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Profile (Optional)</span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Saved on your device and SOS panel in case you need immediate assistance or become disoriented.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Emergency Contact Name
              </label>
              <input
                type="text"
                placeholder="e.g. Maria (Sister)"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                Emergency Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +1 555-0199"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
              Medical Notes / Conditions / Allergies
            </label>
            <input
              type="text"
              placeholder="e.g. Wheelchair user, Asthma inhaler in bag, Non-verbal when stressed"
              value={emergencyNotes}
              onChange={(e) => setEmergencyNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={handleFinish}
          className="touch-target w-full py-4 px-6 bg-black dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-black font-extrabold text-lg rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98]"
        >
          <span>{t.getStarted}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
