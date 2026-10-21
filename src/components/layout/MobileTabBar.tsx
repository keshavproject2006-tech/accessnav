import React, { useState } from 'react';
import {
  Home,
  MapPin,
  Eye,
  Mic,
  Menu,
  X,
  Captions,
  ShieldAlert,
  Settings,
  ScanLine,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ActiveTab } from '../../types';

export const MobileTabBar: React.FC = () => {
  const { activeTab, setActiveTab, stopSpeaking, triggerHaptic } = useAccessibility();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleSelectTab = (tab: ActiveTab) => {
    stopSpeaking();
    triggerHaptic('click');
    setActiveTab(tab);
    setShowMoreMenu(false);
  };

  const primaryTabs: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'navigate', label: 'Chennai Map', icon: MapPin },
    { id: 'scene', label: 'Vision', icon: Eye },
    { id: 'voice', label: 'Voice', icon: Mic },
  ];

  return (
    <>
      {/* More Tools Modal */}
      {showMoreMenu && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More Accessibility Tools"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end md:hidden animate-fade-in"
        >
          <div className="bg-white dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-700 rounded-t-2xl p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Additional Tools
              </h2>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="touch-target p-2 text-neutral-600 dark:text-neutral-400"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleSelectTab('emergency')}
                className="touch-target w-full p-3 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-bold text-sm flex items-center gap-3 text-left"
              >
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Emergency SOS & Medical Card</span>
              </button>

              <button
                onClick={() => handleSelectTab('captions')}
                className="touch-target w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm flex items-center gap-3 text-left"
              >
                <Captions className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                <span>Live Captions</span>
              </button>

              <button
                onClick={() => handleSelectTab('text_reader')}
                className="touch-target w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm flex items-center gap-3 text-left"
              >
                <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                <span>Text Simplifier</span>
              </button>

              <button
                onClick={() => handleSelectTab('signs')}
                className="touch-target w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm flex items-center gap-3 text-left"
              >
                <ScanLine className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                <span>Sign & Medicine Label Reader</span>
              </button>

              <button
                onClick={() => handleSelectTab('settings')}
                className="touch-target w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm flex items-center gap-3 text-left"
              >
                <Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
                <span>Accessibility Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Mobile Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-neutral-950/95 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md px-1 py-1 md:hidden"
      >
        <div className="flex items-center justify-around h-14">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                className={`touch-target flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors ${
                  isActive
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-neutral-500 dark:text-neutral-400 font-medium'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}

          {/* More menu */}
          <button
            onClick={() => {
              triggerHaptic('click');
              setShowMoreMenu(true);
            }}
            className={`touch-target flex flex-col items-center justify-center flex-1 h-full rounded-lg transition-colors ${
              showMoreMenu || ['captions', 'text_reader', 'signs', 'emergency', 'settings'].includes(activeTab)
                ? 'text-black dark:text-white font-extrabold'
                : 'text-neutral-500 dark:text-neutral-400 font-medium'
            }`}
            aria-label="More"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
