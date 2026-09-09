import React from 'react';
import { Language, ActiveTab } from '../types';
import { translations } from '../data/translations';

interface TopAppBarProps {
  language: Language;
  onToggleLanguage: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenDrawer: () => void;
  showBack?: boolean;
  onBack?: () => void;
  titleOverride?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  language,
  onToggleLanguage,
  activeTab,
  onSelectTab,
  onOpenDrawer,
  showBack,
  onBack,
  titleOverride,
}) => {
  const t = translations[language];

  return (
    <header className="bg-surface shadow-sm sticky top-0 w-full z-50 transition-colors">
      <div className="max-w-[800px] mx-auto flex justify-between items-center px-4 md:px-6 py-2.5 h-[64px]">
        {/* Left: Menu or Back */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={onBack}
              className="w-10 h-10 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high active:scale-95 transition-all"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
          ) : (
            <button
              onClick={onOpenDrawer}
              className="w-10 h-10 flex items-center justify-center text-primary rounded-full hover:bg-surface-container-high active:scale-95 transition-all"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('home')}
            className="text-left group cursor-pointer"
          >
            <h1 className="font-headline text-xl md:text-2xl font-bold text-primary tracking-tight">
              {titleOverride || t.appName}
            </h1>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onSelectTab('home')}
            className={`font-body font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'home' ? 'text-primary bg-primary-fixed/60 font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            {t.home}
          </button>
          <button
            onClick={() => onSelectTab('schemes')}
            className={`font-body font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'schemes' || activeTab === 'intake' ? 'text-primary bg-primary-fixed/60 font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
            {t.schemes}
          </button>
          <button
            onClick={() => onSelectTab('calculator')}
            className={`font-body font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'calculator' ? 'text-primary bg-primary-fixed/60 font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calculate</span>
            {t.calculator}
          </button>
          <button
            onClick={() => onSelectTab('checklist')}
            className={`font-body font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'checklist' ? 'text-primary bg-primary-fixed/60 font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">checklist</span>
            {t.checklist}
          </button>
          <button
            onClick={() => onSelectTab('locator')}
            className={`font-body font-semibold text-sm transition-colors py-1.5 px-2 rounded-lg flex items-center gap-1.5 ${
              activeTab === 'locator' ? 'text-primary bg-primary-fixed/60 font-bold' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">distance</span>
            {t.locator}
          </button>
        </nav>

        {/* Right: Bilingual Toggle Button */}
        <button
          onClick={onToggleLanguage}
          className="font-body font-bold text-xs md:text-sm text-primary px-3 py-1.5 rounded-full border border-primary/20 bg-surface-container-lowest hover:bg-surface-container-high active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
          title="Switch Language / भाषा बदलें"
        >
          <span className="material-symbols-outlined text-[16px]">translate</span>
          <span>{t.langToggle}</span>
          <span className="text-[10px] bg-primary-fixed px-1.5 py-0.5 rounded text-primary font-bold">
            {language.toUpperCase()}
          </span>
        </button>
      </div>
    </header>
  );
};
