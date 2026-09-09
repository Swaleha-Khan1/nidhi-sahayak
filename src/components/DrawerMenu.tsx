import React from 'react';
import { Language, ActiveTab } from '../types';
import { translations } from '../data/translations';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onSelectTab: (tab: ActiveTab) => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  language,
  onSelectTab,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-80 max-w-[85vw] bg-surface-container-lowest h-full shadow-2xl z-10 flex flex-col justify-between p-5 overflow-y-auto animate-fade-in border-r border-primary/20">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-surface-variant">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-xl">account_balance</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-primary leading-tight">
                  {t.appName}
                </h2>
                <span className="text-[10px] text-on-surface-variant block">
                  NSFDC Official Portal
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Helpline Alert Banner */}
          <div className="bg-secondary-fixed/40 border border-secondary/30 rounded-xl p-3 text-xs space-y-1">
            <span className="font-bold text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>{t.tollFree}</span>
            </span>
            <p className="text-on-surface-variant text-[11px]">
              Available Monday to Friday, 9:30 AM – 5:30 PM (Toll-Free National Support)
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'home', label: t.home, icon: 'home' },
              { id: 'schemes', label: t.schemes, icon: 'account_balance_wallet' },
              { id: 'calculator', label: t.calculator, icon: 'calculate' },
              { id: 'checklist', label: t.checklist, icon: 'checklist' },
              { id: 'locator', label: t.locator, icon: 'distance' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as ActiveTab);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-body font-bold text-sm text-on-surface hover:bg-primary-fixed/40 hover:text-primary transition-all text-left"
              >
                <span className="material-symbols-outlined text-primary text-xl">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Scheme Quick Information */}
          <div className="pt-2 border-t border-surface-variant space-y-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
              Official Links & Rules
            </span>
            <div className="text-xs text-on-surface space-y-2">
              <a
                href="https://nsfdc.nic.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span>NSFDC Official Website</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
              <a
                href="https://socialjustice.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low hover:bg-surface-container transition-colors"
              >
                <span>Ministry of Social Justice</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-surface-variant text-[11px] text-on-surface-variant space-y-1">
          <p className="font-semibold text-primary">{t.poweredBy}</p>
          <p>Government of India Enterprise under Ministry of Social Justice & Empowerment</p>
        </div>
      </div>
    </div>
  );
};
