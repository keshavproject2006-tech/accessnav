import React, { useEffect } from 'react';
import {
  Map,
  Eye,
  Mic,
  Captions,
  ShieldAlert,
  Settings,
  ArrowRight,
  MapPin,
  Volume2,
  Check,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { ActiveTab } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, preferences, setActiveTab, stopSpeaking, triggerHaptic } = useAccessibility();

  // Stop any audio when on dashboard
  useEffect(() => {
    return () => stopSpeaking();
  }, [stopSpeaking]);

  const handleLaunch = (tab: ActiveTab) => {
    triggerHaptic('click');
    setActiveTab(tab);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Clean, Minimalist Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
            AccessNav • Tamil Nadu, India
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white mt-0.5">
            Welcome, {user?.displayName ? user.displayName.split(' ')[0] : 'Explorer'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Simple AI tools to understand your surroundings, read labels, and navigate Chennai step-free.
          </p>
        </div>

        {/* Chennai Map Fast Action Button */}
        <button
          onClick={() => handleLaunch('navigate')}
          className="touch-target px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 self-start sm:self-auto shadow active:scale-98"
        >
          <MapPin className="w-4 h-4 text-amber-400 dark:text-amber-600" />
          <span>Open Chennai Map</span>
        </button>
      </div>

      {/* 4 Simplified Primary Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Chennai Maps & Navigation */}
        <button
          onClick={() => handleLaunch('navigate')}
          className="touch-target text-left p-6 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all shadow-sm flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
              <Map className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Chennai Maps & Routes
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              Explore Puratchi Thalaivar MGR Central, CMRL Metro, Marina Beach wooden ramp, CMBT, and Airport with step-free directions.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
            <span>Explore Chennai Map</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* 2. Camera Vision: Scene & Sign Describer */}
        <button
          onClick={() => handleLaunch('scene')}
          className="touch-target text-left p-6 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all shadow-sm flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mb-4">
              <Eye className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Scene & Sign Describer
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              Point your camera to detect walking paths, stairs, trip hazards, street signs, and medicine labels read aloud.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
            <span>Open Camera Vision</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* 3. Voice Assistant */}
        <button
          onClick={() => handleLaunch('voice')}
          className="touch-target text-left p-6 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all shadow-sm flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Voice Assistant
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              Large push-to-talk button. Speak naturally to ask questions, request routes, or control accessibility hands-free.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
            <span>Start Voice Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* 4. Live Captions & Text Reader */}
        <button
          onClick={() => handleLaunch('captions')}
          className="touch-target text-left p-6 rounded-2xl border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-black dark:hover:border-white transition-all shadow-sm flex flex-col justify-between group"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center mb-4">
              <Captions className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              Live Captions & Text Reader
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
              Real-time large subtitles for speech, plus cognitive text simplification for complicated documents.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform">
            <span>Open Captions</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Simplified Bottom Bar for Emergency SOS and Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <button
          onClick={() => handleLaunch('emergency')}
          className="touch-target p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 flex items-center justify-between font-bold text-sm"
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Emergency SOS & Medical Card</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleLaunch('settings')}
          className="touch-target p-4 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 flex items-center justify-between font-bold text-sm"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-neutral-600" />
            <span>Settings (Text Size: {preferences.fontSize}%)</span>
          </div>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
