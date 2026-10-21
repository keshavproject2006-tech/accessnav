import React, { useState, useEffect } from 'react';
import {
  Navigation,
  MapPin,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  AlertTriangle,
  Accessibility,
  MessageSquare,
  Map as MapIcon,
  Compass,
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { NavigationResult } from '../types';
import { saveHistoryItem } from '../lib/firebase';
import { ChennaiMap } from '../components/ChennaiMap';

export const NavigationHelperPage: React.FC = () => {
  const { user, speak, stopSpeaking, isSpeaking, triggerHaptic, announce, preferences } =
    useAccessibility();

  const [activeView, setActiveView] = useState<'map' | 'route'>('map');
  const [destination, setDestination] = useState('Puratchi Thalaivar Dr. M.G.R Chennai Central Station');
  const [currentSpot, setCurrentSpot] = useState('Central Metro Station Interchange, Chennai');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NavigationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const handleSelectFromMap = (destName: string) => {
    setDestination(destName);
    setActiveView('route');
    announce(`Selected destination: ${destName}. Ready to plan route.`, 'polite');
  };

  const handleSpeechInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      announce('Speech recognition not available', 'assertive');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = preferences.language === 'ta' ? 'ta-IN' : 'en-IN';
    recognition.onstart = () => {
      triggerHaptic('click');
      announce('Listening for Chennai destination...', 'polite');
    };
    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setDestination(text);
      announce(`Destination set to ${text}`, 'polite');
    };
    recognition.start();
  };

  const handlePlanRoute = async (destToPlan?: string) => {
    const target = destToPlan || destination;
    if (!target.trim()) {
      setError('Please specify a destination.');
      return;
    }

    triggerHaptic('click');
    setLoading(true);
    setError(null);
    announce(`Planning accessible route to ${target} in Chennai...`, 'polite');

    try {
      const res = await fetch('/api/gemini/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: `${target}, Chennai, Tamil Nadu, India`,
          currentLocation: currentSpot,
          accessibilityNeeds: [
            'Step-free wheelchair routes and elevators',
            'Tactile ground paving and cane guides',
            'Tamil Nadu transit and landmark assistance',
          ],
          language: preferences.language,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to generate accessible route.');
      }

      const data: NavigationResult = json.data;
      setResult(data);
      setActiveView('route');
      triggerHaptic('success');
      announce(`Accessible route created for ${data.routeTitle}`, 'polite');

      if (user) {
        saveHistoryItem(user.uid, {
          type: 'navigation_route',
          title: data.routeTitle,
          content: JSON.stringify(data.steps),
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred while planning route.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Navigation className="w-7 h-7 text-amber-600 dark:text-yellow-400" />
            <span>Accessible Navigation</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Chennai, Tamil Nadu interactive accessible maps, transit hubs, and step-free directions.
          </p>
        </div>

        {/* View Switcher: Chennai Map vs Step-by-Step Directions */}
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl self-start sm:self-auto border border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => {
              triggerHaptic('click');
              setActiveView('map');
            }}
            className={`touch-target px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'map'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-black'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Chennai Map</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('click');
              setActiveView('route');
            }}
            className={`touch-target px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeView === 'route'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-neutral-700 dark:text-neutral-300 hover:text-black'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Directions</span>
          </button>
        </div>
      </div>

      {/* Chennai Map View */}
      {activeView === 'map' && (
        <div className="space-y-4">
          <ChennaiMap onSelectDestination={handleSelectFromMap} />
        </div>
      )}

      {/* Route Directions View */}
      {activeView === 'route' && (
        <div className="space-y-5">
          {/* Destination Form */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label
                htmlFor="destination-input"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Destination in Chennai:
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  id="destination-input"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Marina Beach Accessible Wooden Ramp or Koyambedu Metro"
                  className="w-full pl-10 pr-12 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSpeechInput}
                  className="touch-target absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-black dark:hover:text-white"
                  aria-label="Speak destination"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="starting-input"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5"
              >
                Starting Point / Current Spot:
              </label>
              <input
                id="starting-input"
                type="text"
                value={currentSpot}
                onChange={(e) => setCurrentSpot(e.target.value)}
                placeholder="e.g. Chennai Central Railway Concourse or Street Level"
                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-500 rounded-xl text-xs text-red-700 dark:text-red-300 font-semibold">
                {error}
              </div>
            )}

            <button
              onClick={() => handlePlanRoute()}
              disabled={loading}
              className="touch-target w-full py-3.5 px-4 bg-black dark:bg-white text-white dark:text-black font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow active:scale-98 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-600" />
              <span>{loading ? 'Calculating Route in Chennai...' : 'Get Accessible Step-by-Step Directions'}</span>
            </button>
          </div>

          {/* Route Results */}
          {result && (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                    {result.routeType}
                  </span>
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mt-1">
                    {result.routeTitle}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      const fullSpeech = `Route to ${result.routeTitle}. ${result.steps
                        .map((s) => `Step ${s.stepNumber}: ${s.instruction}. ${s.accessibilityTip}`)
                        .join(' ')}`;
                      speak(fullSpeech);
                    }
                  }}
                  className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all self-start sm:self-auto ${
                    isSpeaking
                      ? 'bg-red-600 text-white border-red-700 animate-pulse'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-600" />}
                  <span>{isSpeaking ? 'Stop Reading' : 'Read Directions'}</span>
                </button>
              </div>

              {/* Safety notice */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{result.safetyDisclaimer}</span>
              </div>

              {/* Steps List */}
              <div className="space-y-3">
                {result.steps?.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-black dark:bg-white text-white dark:text-black font-extrabold text-xs flex items-center justify-center shrink-0">
                        {step.stepNumber}
                      </span>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                        {step.instruction}
                      </p>
                    </div>

                    {step.accessibilityTip && (
                      <div className="ml-8 text-xs text-blue-700 dark:text-yellow-300 flex items-start gap-1 font-medium">
                        <Accessibility className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{step.accessibilityTip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Staff phrase */}
              {result.whatToAskStaff && (
                <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-300 dark:border-neutral-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Show or Play to Chennai Metro / Station Staff:
                    </span>
                    <button
                      onClick={() => speak(result.whatToAskStaff)}
                      className="text-xs font-bold text-blue-600 dark:text-yellow-400 underline"
                    >
                      Speak for Me
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white italic">
                    "{result.whatToAskStaff}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
