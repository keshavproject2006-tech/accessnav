/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AccessibilityProvider, useAccessibility } from './context/AccessibilityContext';
import { Header } from './components/layout/Header';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { SceneDescriberPage } from './pages/SceneDescriberPage';
import { TextReaderPage } from './pages/TextReaderPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { NavigationHelperPage } from './pages/NavigationHelperPage';
import { LiveCaptionsPage } from './pages/LiveCaptionsPage';
import { SignReaderPage } from './pages/SignReaderPage';
import { EmergencyPanelPage } from './pages/EmergencyPanelPage';
import { ChatAssistantPage } from './pages/ChatAssistantPage';
import { SettingsPage } from './pages/SettingsPage';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading, activeTab } = useAccessibility();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-neutral-900 dark:text-white p-4"
        aria-busy="true"
        aria-live="polite"
      >
        <RefreshCw className="w-10 h-10 animate-spin text-blue-600 dark:text-yellow-400 mb-4" />
        <p className="font-extrabold text-lg tracking-tight">AccessNav</p>
        <p className="text-xs text-neutral-500 mt-1">Initializing accessibility engines...</p>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!user) {
    return <LoginPage />;
  }

  // First time user -> Show Onboarding
  if (!user.onboardingComplete) {
    return <OnboardingPage />;
  }

  // Main Authenticated Application Layout
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors">
      <Header />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Desktop Left Navigation */}
        <DesktopSidebar />

        {/* Main Content Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 sm:p-6 md:p-8 outline-none focus:ring-0"
        >
          {activeTab === 'home' && <DashboardPage />}
          {activeTab === 'scene' && <SceneDescriberPage />}
          {activeTab === 'text_reader' && <TextReaderPage />}
          {activeTab === 'voice' && <VoiceAssistantPage />}
          {activeTab === 'navigate' && <NavigationHelperPage />}
          {activeTab === 'captions' && <LiveCaptionsPage />}
          {activeTab === 'signs' && <SignReaderPage />}
          {activeTab === 'emergency' && <EmergencyPanelPage />}
          {activeTab === 'chat' && <ChatAssistantPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <MobileTabBar />
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
