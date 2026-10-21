import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Type,
  SunMoon,
  AlertTriangle,
  LogOut,
  User,
  Globe,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { SupportedLanguage } from '../../types';

export const Header: React.FC = () => {
  const {
    user,
    preferences,
    updatePreferences,
    signOutUser,
    isSpeaking,
    stopSpeaking,
    t,
    setActiveTab,
    triggerHaptic,
    announce,
  } = useAccessibility();

  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleHighContrast = () => {
    triggerHaptic('click');
    const nextState = !preferences.highContrast;
    updatePreferences({
      highContrast: nextState,
      theme: nextState ? 'high-contrast' : 'light',
    });
    announce(nextState ? 'High contrast mode enabled' : 'High contrast mode disabled');
  };

  const increaseFontSize = () => {
    triggerHaptic('click');
    const current = preferences.fontSize || 100;
    const next = current >= 180 ? 100 : current + 20;
    updatePreferences({ fontSize: next });
    announce(`Text size set to ${next} percent`);
  };

  const changeLanguage = (lang: SupportedLanguage) => {
    triggerHaptic('click');
    updatePreferences({ language: lang });
    setShowLangMenu(false);
    announce(`Language changed to ${lang.toUpperCase()}`);
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
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <button
          onClick={() => {
            stopSpeaking();
            setActiveTab('home');
          }}
          className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600 rounded-lg p-1.5 -ml-1.5"
          aria-label="AccessNav Home"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-black dark:bg-white text-white dark:text-black rounded-lg flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm tracking-tight border border-neutral-300 dark:border-neutral-700">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white tracking-tight">
                AccessNav
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-300 dark:border-neutral-700">
                Chennai, TN
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Quick Accessibility Controls Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* TTS Speaking Indicator & Stop Button */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="touch-target flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs sm:text-sm animate-pulse shadow-md focus:ring-4 focus:ring-red-400"
              aria-label="Stop reading audio aloud"
            >
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t.stopAudio}</span>
            </button>
          )}

          {/* Emergency SOS Quick Button */}
          <button
            onClick={() => {
              stopSpeaking();
              triggerHaptic('alert');
              setActiveTab('emergency');
            }}
            className="touch-target flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 border-2 border-red-500"
            aria-label="Open Emergency SOS Panel immediately"
          >
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
            <span className="tracking-wide">SOS</span>
          </button>

          {/* Quick Font Size Switcher */}
          <button
            onClick={increaseFontSize}
            className="touch-target flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 transition-colors"
            title={`Font scale: ${preferences.fontSize}% (Click to cycle)`}
            aria-label={`Cycle font size. Current is ${preferences.fontSize} percent`}
          >
            <Type className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs font-bold ml-1 hidden sm:inline">
              {preferences.fontSize}%
            </span>
          </button>

          {/* High Contrast / Dark Mode Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`touch-target flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-lg border transition-colors ${
              preferences.highContrast
                ? 'bg-yellow-400 text-black border-yellow-500 font-bold'
                : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700'
            }`}
            title="Toggle High Contrast Mode"
            aria-label={`Toggle high contrast mode. Currently ${preferences.highContrast ? 'On' : 'Off'}`}
          >
            <SunMoon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="sr-only">High Contrast</span>
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="touch-target flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700"
              aria-label={`Change language. Current: ${preferences.language.toUpperCase()}`}
              aria-expanded={showLangMenu}
            >
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-600 dark:text-neutral-300" />
              <span className="text-xs uppercase font-bold hidden sm:inline">
                {preferences.language}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {showLangMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 rounded-xl shadow-2xl py-2 z-50"
                role="menu"
              >
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                  Select Language
                </div>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className="w-full text-left px-3 py-2.5 text-sm flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    role="menuitem"
                  >
                    <span>
                      {l.label}{' '}
                      <span className="text-neutral-500 dark:text-neutral-400 text-xs">
                        ({l.native})
                      </span>
                    </span>
                    {preferences.language === l.code && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Sign Out Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="touch-target flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="User account menu"
              aria-expanded={showProfileMenu}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-neutral-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-700 dark:text-neutral-200">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline text-neutral-800 dark:text-neutral-200">
                {user?.isGuest ? 'Guest' : user?.displayName || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border-2 border-neutral-900 dark:border-neutral-100 rounded-xl shadow-2xl p-3 z-50"
                role="menu"
              >
                <div className="pb-3 border-b border-neutral-200 dark:border-neutral-800">
                  <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                    {user?.displayName || 'Explorer'}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {user?.isGuest ? 'Guest Session' : user?.email || 'Authenticated'}
                  </p>
                  {user?.isGuest && (
                    <span className="inline-block mt-1 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded">
                      Local Storage Mode
                    </span>
                  )}
                </div>

                <div className="py-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg flex items-center gap-2"
                  >
                    <span>{t.settings}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab('emergency');
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-2 font-medium"
                  >
                    <span>{t.emergency}</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOutUser();
                    }}
                    className="w-full px-3 py-2.5 text-sm bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    <span>{t.signOut}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
