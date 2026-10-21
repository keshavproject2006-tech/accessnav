import React from 'react';
import {
  Home,
  MapPin,
  Eye,
  Mic,
  Captions,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ActiveTab } from '../../types';

export const DesktopSidebar: React.FC = () => {
  const { activeTab, setActiveTab, stopSpeaking } = useAccessibility();

  const handleNav = (tab: ActiveTab) => {
    stopSpeaking();
    setActiveTab(tab);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; isEmergency?: boolean }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'navigate', label: 'Chennai Map & Routes', icon: MapPin },
    { id: 'scene', label: 'Camera Vision', icon: Eye },
    { id: 'voice', label: 'Voice Assistant', icon: Mic },
    { id: 'captions', label: 'Live Captions', icon: Captions },
    { id: 'emergency', label: 'Emergency SOS', icon: ShieldAlert, isEmergency: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      aria-label="Sidebar Navigation"
      className="hidden md:flex flex-col w-60 lg:w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-3 sticky top-16 sm:top-20 min-h-[calc(100vh-5rem)] self-start"
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-2 px-3 pt-1">
        Menu
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          let btnClass =
            'touch-target w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-colors text-left ';

          if (item.isEmergency) {
            btnClass += isActive
              ? 'bg-red-600 text-white font-extrabold shadow'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 ';
          } else if (isActive) {
            btnClass += 'bg-black text-white dark:bg-white dark:text-black shadow-sm font-extrabold ';
          } else {
            btnClass += 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 ';
          }

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={btnClass}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 px-3">
        Chennai, Tamil Nadu Maps
      </div>
    </aside>
  );
};
