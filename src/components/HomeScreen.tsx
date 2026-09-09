import React from 'react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface HomeScreenProps {
  language: Language;
  onStartForm: () => void;
  onStartChat: () => void;
  onOpenCalculator: () => void;
  onOpenLocator: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  language,
  onStartForm,
  onStartChat,
  onOpenCalculator,
  onOpenLocator,
}) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">
      {/* Hero Headline */}
      <section className="flex flex-col gap-4">
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-background tracking-tight leading-tight">
          {t.heroTitle}
        </h2>

        {/* Atmospheric Banner Image */}
        <div className="w-full h-48 md:h-64 rounded-2xl shadow-sm bg-cover bg-center border border-surface-container-high relative overflow-hidden group">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXCRsLo7CoWiiTO66hODzY9UD58_wC5iMnesD0Q33GOplOSLYI1IxYshRlBZDk-e7248Uy7VKWNQA4xXW3UXY3Zqa0rKzw86FOqcLfAEipZc41uu2SXw45Dtgvq2Y5cGEqNnNwo2uOjuIblJVGB9f4wm_ZaigYQpbjZigKv5dipA-ky7o2wjPIpswxfS6pPDQtEYdR_ymN3cJvDYfOxrTq3gceEeQaCF7ei7IbBCAAjWwiZG-riZo"
            alt={t.heroAlt}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-primary flex items-center gap-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
            <span>National SC Finance & Development Corp.</span>
          </div>
        </div>
      </section>

      {/* Main Bento Action Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Structured Form Mode */}
        <button
          onClick={onStartForm}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-primary/10 shadow-[0_4px_14px_rgba(0,6,102,0.08)] flex flex-col items-start gap-3 hover:bg-surface-container-low hover:border-primary/25 transition-all duration-200 active:scale-[0.98] text-left relative overflow-hidden cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              assignment
            </span>
          </div>
          <div>
            <h3 className="font-headline text-lg font-bold text-on-background group-hover:text-primary transition-colors">
              {t.card1Title}
            </h3>
            <p className="font-body text-sm text-on-surface-variant mt-1 leading-relaxed">
              {t.card1Desc}
            </p>
          </div>
          <div className="mt-auto pt-3 flex items-center text-primary font-body font-bold text-sm group-hover:translate-x-1 transition-transform">
            <span>{t.card1Action}</span>
            <span className="material-symbols-outlined text-sm ml-1.5">arrow_forward</span>
          </div>
        </button>

        {/* Card 2: AI / Chat Natural Mode */}
        <button
          onClick={onStartChat}
          className="group bg-surface-container-lowest rounded-2xl p-5 border border-secondary/20 shadow-[0_4px_14px_rgba(143,78,0,0.08)] flex flex-col items-start gap-3 hover:bg-surface-container-low hover:border-secondary/40 transition-all duration-200 active:scale-[0.98] text-left relative overflow-hidden cursor-pointer"
        >
          {/* Orange indicator bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container" />
          <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary group-hover:scale-110 transition-transform ml-1">
            <span
              className="material-symbols-outlined text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              chat_bubble
            </span>
          </div>
          <div className="ml-1">
            <h3 className="font-headline text-lg font-bold text-on-background group-hover:text-secondary transition-colors">
              {t.card2Title}
            </h3>
            <p className="font-body text-sm text-on-surface-variant mt-1 leading-relaxed">
              {t.card2Desc}
            </p>
          </div>
          <div className="mt-auto pt-3 flex items-center text-secondary font-body font-bold text-sm ml-1 group-hover:translate-x-1 transition-transform">
            <span>{t.card2Action}</span>
            <span className="material-symbols-outlined text-sm ml-1.5">arrow_forward</span>
          </div>
        </button>
      </section>

      {/* Quick Direct Tools Grid */}
      <section className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={onOpenCalculator}
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 rounded-xl p-3.5 flex items-center gap-3 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-primary text-xl bg-primary-fixed/60 p-2 rounded-lg">calculate</span>
          <div>
            <div className="font-body font-bold text-xs text-on-surface">{t.quickCalculator}</div>
            <div className="text-[11px] text-on-surface-variant">Live Amortization</div>
          </div>
        </button>

        <button
          onClick={onOpenLocator}
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 rounded-xl p-3.5 flex items-center gap-3 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-secondary text-xl bg-secondary-fixed/60 p-2 rounded-lg">distance</span>
          <div>
            <div className="font-body font-bold text-xs text-on-surface">{t.quickLocator}</div>
            <div className="text-[11px] text-on-surface-variant">SCAs, PSBs & RRBs</div>
          </div>
        </button>
      </section>

      {/* Trust Line */}
      <footer className="py-4 flex justify-center items-center gap-2 text-on-surface-variant text-xs opacity-90 border-t border-surface-variant/40 mt-2">
        <span className="material-symbols-outlined text-base text-primary">verified_user</span>
        <span className="font-body">{t.trustLine}</span>
      </footer>
    </div>
  );
};
