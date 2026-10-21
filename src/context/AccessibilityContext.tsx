import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  UserProfile,
  UserPreferences,
  ActiveTab,
  SupportedLanguage,
} from '../types';
import {
  auth,
  onAuthStateChanged,
  fetchUserProfile,
  saveUserProfile,
  DEFAULT_PREFERENCES,
  getGuestProfile,
  createGuestSession,
  logOut as fbLogOut,
  FirebaseUser,
} from '../lib/firebase';
import { translations, TranslationDictionary } from '../lib/translations';

interface AccessibilityContextType {
  user: UserProfile | null;
  loading: boolean;
  preferences: UserPreferences;
  t: TranslationDictionary;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  completeOnboarding: (prefs?: Partial<UserPreferences>) => Promise<void>;
  loginAsGuest: () => void;
  signOutUser: () => Promise<void>;
  // TTS
  speak: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  availableVoices: SpeechSynthesisVoice[];
  // Haptics
  triggerHaptic: (type?: 'click' | 'success' | 'warning' | 'alert') => void;
  // Screen reader live announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  politeAnnouncement: string;
  assertiveAnnouncement: string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [activeTab, setActiveTabState] = useState<ActiveTab>('home');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [politeAnnouncement, setPoliteAnnouncement] = useState<string>('');
  const [assertiveAnnouncement, setAssertiveAnnouncement] = useState<string>('');

  const currentSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Logged in via Firebase
        const existingProfile = await fetchUserProfile(fbUser.uid);
        if (existingProfile) {
          setUser(existingProfile);
          setPreferences(existingProfile.preferences || DEFAULT_PREFERENCES);
        } else {
          // First time user
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'User'),
            photoURL: fbUser.photoURL,
            isGuest: false,
            onboardingComplete: false,
            preferences: { ...DEFAULT_PREFERENCES },
          };
          await saveUserProfile(newProfile);
          setUser(newProfile);
          setPreferences(newProfile.preferences);
        }
      } else {
        // Check for guest profile in localStorage
        const guest = getGuestProfile();
        if (guest) {
          setUser(guest);
          setPreferences(guest.preferences || DEFAULT_PREFERENCES);
        } else {
          setUser(null);
          setPreferences(DEFAULT_PREFERENCES);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Apply DOM accessibility changes whenever preferences change
  useEffect(() => {
    const root = document.documentElement;

    // 1. Font size scale
    const scale = (preferences.fontSize || 100) / 100;
    root.style.setProperty('--app-font-scale', scale.toString());

    // 2. High contrast mode & Theme
    if (preferences.highContrast || preferences.theme === 'high-contrast') {
      root.classList.add('theme-high-contrast', 'dark');
      root.classList.remove('light');
    } else if (preferences.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('theme-high-contrast', 'light');
    } else {
      root.classList.remove('dark', 'theme-high-contrast');
      root.classList.add('light');
    }

    // 3. Dyslexia font
    if (preferences.dyslexiaFont) {
      root.classList.add('font-dyslexia');
    } else {
      root.classList.remove('font-dyslexia');
    }

    // 4. Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // 5. Colorblind modes
    root.classList.remove(
      'colorblind-protanopia',
      'colorblind-deuteranopia',
      'colorblind-tritanopia',
      'colorblind-monochrome'
    );
    if (preferences.colorBlindMode && preferences.colorBlindMode !== 'none') {
      root.classList.add(`colorblind-${preferences.colorBlindMode}`);
    }
  }, [preferences]);

  // Update preferences and persist
  const updatePreferences = useCallback(
    async (partial: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...partial };
        if (user) {
          const updatedUser: UserProfile = { ...user, preferences: next };
          setUser(updatedUser);
          saveUserProfile(updatedUser);
        }
        return next;
      });
    },
    [user]
  );

  // Complete Onboarding
  const completeOnboarding = useCallback(
    async (additionalPrefs?: Partial<UserPreferences>) => {
      if (!user) return;
      const mergedPrefs = { ...preferences, ...(additionalPrefs || {}) };
      const updatedUser: UserProfile = {
        ...user,
        onboardingComplete: true,
        preferences: mergedPrefs,
      };
      setUser(updatedUser);
      setPreferences(mergedPrefs);
      await saveUserProfile(updatedUser);
      announce('Welcome to AccessNav! Your accessibility preferences are saved.', 'polite');
    },
    [user, preferences]
  );

  // Guest login
  const loginAsGuest = useCallback(() => {
    const guest = createGuestSession();
    setUser(guest);
    setPreferences(guest.preferences);
    announce('Logged in as Guest Explorer. Exploring AccessNav in guest mode.', 'polite');
  }, []);

  // Sign out
  const signOutUser = useCallback(async () => {
    stopSpeaking();
    await fbLogOut();
    setUser(null);
    setPreferences(DEFAULT_PREFERENCES);
    setActiveTabState('home');
    announce('Signed out successfully.', 'polite');
  }, []);

  // Screen reader announcement
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveAnnouncement('');
      setTimeout(() => setAssertiveAnnouncement(message), 50);
    } else {
      setPoliteAnnouncement('');
      setTimeout(() => setPoliteAnnouncement(message), 50);
    }
  }, []);

  // Haptic feedback
  const triggerHaptic = useCallback(
    (type: 'click' | 'success' | 'warning' | 'alert' = 'click') => {
      if (!preferences.hapticFeedback || typeof window === 'undefined' || !navigator.vibrate) {
        return;
      }
      try {
        switch (type) {
          case 'click':
            navigator.vibrate(15);
            break;
          case 'success':
            navigator.vibrate([20, 50, 30]);
            break;
          case 'warning':
            navigator.vibrate([50, 40, 50]);
            break;
          case 'alert':
            navigator.vibrate([100, 50, 100, 50, 200]);
            break;
        }
      } catch (e) {
        // Ignore vibration errors if blocked by browser policy
      }
    },
    [preferences.hapticFeedback]
  );

  // Text to Speech
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      triggerHaptic('click');

      const cleanText = text.replace(/[*#_`]/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = preferences.ttsSpeed || 1.0;

      // Select voice matching language if available
      if (preferences.ttsVoice) {
        const found = availableVoices.find((v) => v.name === preferences.ttsVoice);
        if (found) utterance.voice = found;
      } else if (preferences.language) {
        const langCode = preferences.language;
        const matchingVoice = availableVoices.find((v) => v.lang.startsWith(langCode));
        if (matchingVoice) utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentSpeechRef.current = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        currentSpeechRef.current = null;
      };

      currentSpeechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [preferences, availableVoices, triggerHaptic]
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentSpeechRef.current = null;
    }
  }, []);

  const setActiveTab = useCallback(
    (tab: ActiveTab) => {
      // Always stop any playing speech synthesis immediately when switching sections
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        currentSpeechRef.current = null;
      }
      setActiveTabState(tab);
      triggerHaptic('click');
      window.scrollTo({ top: 0, behavior: preferences.reducedMotion ? 'auto' : 'smooth' });
    },
    [triggerHaptic, preferences.reducedMotion]
  );

  const currentTranslations = translations[preferences.language] || translations.en;

  return (
    <AccessibilityContext.Provider
      value={{
        user,
        loading,
        preferences,
        t: currentTranslations,
        activeTab,
        setActiveTab,
        updatePreferences,
        completeOnboarding,
        loginAsGuest,
        signOutUser,
        speak,
        stopSpeaking,
        isSpeaking,
        availableVoices,
        triggerHaptic,
        announce,
        politeAnnouncement,
        assertiveAnnouncement,
      }}
    >
      {/* SVG Filters for Color Blind Modes */}
      <svg className="sr-only" aria-hidden="true">
        <filter id="protanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.567, 0.433, 0,     0, 0
                    0.558, 0.442, 0,     0, 0
                    0,     0.242, 0.758, 0, 0
                    0,     0,     0,     1, 0"
          />
        </filter>
        <filter id="deuteranopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.625, 0.375, 0,   0, 0
                    0.7,   0.3,   0,   0, 0
                    0,     0.3,   0.7, 0, 0
                    0,     0,     0,   1, 0"
          />
        </filter>
        <filter id="tritanopia-filter">
          <feColorMatrix
            type="matrix"
            values="0.95, 0.05,  0,     0, 0
                    0,    0.433, 0.567, 0, 0
                    0,    0.475, 0.525, 0, 0
                    0,    0,     0,     1, 0"
          />
        </filter>
      </svg>

      {/* Screen Reader Announcements */}
      <div
        id="sr-polite-region"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncement}
      </div>
      <div
        id="sr-assertive-region"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncement}
      </div>

      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
