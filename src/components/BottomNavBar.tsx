import React from 'react';
import { ActiveTab, Language } from '../types';
import { translations } from '../data/translations';

interface BottomNavBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: Language;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  language,
}) => {
  const t = translations[language];

  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: 'home', label: t.home, icon: 'home' },
    { id: 'schemes', label: t.schemes, icon: 'account_balance_wallet' },
    { id: 'calculator', label: t.calculator, icon: 'calculate' },
    { id: 'checklist', label: t.checklist, icon: 'checklist' },
    { id: 'locator', label: t.locator, icon: 'distance' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest shadow-[0_-4px_16px_rgba(26,35,126,0.1)] border-t border-outline-variant/30 rounded-t-2xl py-1.5 px-2 flex justify-around items-center">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id || (tab.id === 'schemes' && activeTab === 'intake');
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 min-h-[44px] ${
              isActive
                ? 'bg-secondary-container text-on-secondary-container font-bold shadow-xs scale-105'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            <span className="text-[11px] font-body mt-0.5 leading-none whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
