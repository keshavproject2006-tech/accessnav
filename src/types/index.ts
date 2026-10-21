export type DisabilityType = 'visual' | 'hearing' | 'mobility' | 'cognitive' | 'speech' | 'none';

export type AppTheme = 'light' | 'dark' | 'high-contrast';

export type ColorBlindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';

export type SupportedLanguage = 'en' | 'es' | 'ta' | 'hi' | 'fr' | 'ar';

export interface UserPreferences {
  fontSize: number; // 100 to 200
  theme: AppTheme;
  highContrast: boolean;
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  colorBlindMode: ColorBlindMode;
  ttsVoice: string;
  ttsSpeed: number; // 0.75 to 2.0
  language: SupportedLanguage;
  hapticFeedback: boolean;
  disabilityTypes: DisabilityType[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyMedicalNotes: string;
  emergencyBloodType: string;
  emergencyAllergies: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isGuest: boolean;
  onboardingComplete: boolean;
  preferences: UserPreferences;
}

export interface SceneResult {
  summary: string;
  immediateHazards: string[];
  pathwayDescription: string;
  peopleAndActivity: string;
  signsAndLabels: string[];
  keyObjects: string[];
  fullDetailedDescription: string;
  spokenAnnouncement: string;
}

export interface SignResult {
  title: string;
  category: string;
  primaryText: string;
  importantWarnings: string[];
  plainExplanation: string;
  details: string[];
  audioReadout: string;
}

export interface TextSimplifyResult {
  title: string;
  simplifiedText: string;
  bulletSummary: string[];
  jargonExplained: Array<{ word: string; meaning: string }>;
  estimatedReadingTimeMinutes: number;
  actionItems: string[];
}

export interface NavigationStep {
  stepNumber: number;
  instruction: string;
  accessibilityTip: string;
  warning?: string;
}

export interface NavigationResult {
  routeTitle: string;
  routeType: string;
  safetyDisclaimer: string;
  keyCheckpoints: string[];
  steps: NavigationStep[];
  whatToAskStaff: string;
  accessibleAmenitiesNearby: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface CaptionSegment {
  id: string;
  text: string;
  timestamp: string;
  isFinal: boolean;
}

export type ActiveTab =
  | 'home'
  | 'scene'
  | 'text_reader'
  | 'voice'
  | 'navigate'
  | 'captions'
  | 'signs'
  | 'emergency'
  | 'chat'
  | 'settings';
