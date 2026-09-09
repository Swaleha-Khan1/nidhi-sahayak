import React, { useState } from 'react';
import { Language, Partner } from '../types';
import { translations } from '../data/translations';
import { CHANNEL_PARTNERS } from '../data/partners';

interface LocatorScreenProps {
  language: Language;
}

export const LocatorScreen: React.FC<LocatorScreenProps> = ({ language }) => {
  const t = translations[language];
  const [partners] = useState<Partner[]>(CHANNEL_PARTNERS);
  const [sortBy, setSortBy] = useState<'availability' | 'distance'>('availability');
  const [filterType, setFilterType] = useState<'ALL' | 'SCA' | 'PSB' | 'RRB' | 'NBFC-MFI'>('ALL');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(CHANNEL_PARTNERS[0].id);
  const [directionsModalPartner, setDirectionsModalPartner] = useState<Partner | null>(null);

  // Filter partners
  const filtered = partners.filter((p) => {
    if (filterType === 'ALL') return true;
    return p.type === filterType;
  });

  // Sort partners
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'availability') {
      const loadRank = { low: 1, medium: 2, full: 3 };
      if (loadRank[a.loadStatus] !== loadRank[b.loadStatus]) {
        return loadRank[a.loadStatus] - loadRank[b.loadStatus];
      }
      return a.fundUtilizationRate - b.fundUtilizationRate;
    }
    return a.distanceKm - b.distanceKm;
  });

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId) || sorted[0];

  const getLoadBadgeClass = (status: 'low' | 'medium' | 'full') => {
    if (status === 'low') {
      return 'bg-tertiary-fixed-dim text-on-tertiary-container border border-tertiary-container/30';
    }
    if (status === 'medium') {
      return 'bg-secondary-fixed/50 text-secondary border border-secondary/30';
    }
    return 'bg-error-container text-on-error-container border border-error/30';
  };

  const getLoadPinBg = (status: 'low' | 'medium' | 'full') => {
    if (status === 'low') return '#5aa958'; // Green
    if (status === 'medium') return '#ff8f00'; // Amber
    return '#ba1a1a'; // Red
  };

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary mb-1">
          {t.locatorTitle}
        </h2>
        <p className="font-body text-xs md:text-sm text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-secondary">info</span>
          <span>{t.dataReflects}</span>
        </p>
      </div>

      {/* Sorting & Type Filters */}
      <div className="flex flex-col md:flex-row justify-between gap-3 items-stretch md:items-center">
        {/* Availability vs Distance Pill Switch */}
        <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/30 text-xs font-bold">
          <button
            onClick={() => setSortBy('availability')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              sortBy === 'availability'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            ✓ {t.bestAvailability}
          </button>
          <button
            onClick={() => setSortBy('distance')}
            className={`flex-1 md:flex-none px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
              sortBy === 'distance'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            📍 {t.nearestFirst}
          </button>
        </div>

        {/* Partner Type Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
          {[
            { id: 'ALL', label: t.allTypes },
            { id: 'SCA', label: 'SCA (Govt)' },
            { id: 'PSB', label: 'PSB Banks' },
            { id: 'RRB', label: 'RRB Gramin' },
            { id: 'NBFC-MFI', label: 'NBFC-MFI' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id as any)}
              className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-all cursor-pointer ${
                filterType === type.id
                  ? 'border-secondary bg-secondary text-on-secondary font-bold shadow-xs'
                  : 'border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Responsive Layout: Map Visualizer + Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Visualizer (4.5 cols on desktop, top on mobile) */}
        <section className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-body font-bold text-xs text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-base">map</span>
              <span>Interactive Map View</span>
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-[#2e7d32]">
                <span className="w-2 h-2 rounded-full bg-[#5aa958]" /> Low
              </span>
              <span className="flex items-center gap-1 text-[#e65100]">
                <span className="w-2 h-2 rounded-full bg-[#ff8f00]" /> Med
              </span>
              <span className="flex items-center gap-1 text-[#c62828]">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]" /> Full
              </span>
            </div>
          </div>

          {/* Map Canvas Frame */}
          <div className="w-full h-56 lg:h-72 rounded-xl bg-slate-100 relative overflow-hidden border border-outline-variant/30 shadow-inner">
            {/* Grid & Map background graphics */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Roads & rivers stylized */}
              <path d="M 0 60 Q 120 40 240 90 T 480 120" fill="none" stroke="#cbd5e1" strokeWidth="6" />
              <path d="M 80 0 Q 100 140 180 240" fill="none" stroke="#cbd5e1" strokeWidth="4" />
              <path d="M 200 0 Q 220 180 320 280" fill="none" stroke="#93c5fd" strokeWidth="5" />
            </svg>

            {/* Map Center Pins */}
            {sorted.map((p) => {
              const isSelected = p.id === selectedPartner.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPartnerId(p.id)}
                  style={{ left: `${p.coordinates.x}%`, top: `${p.coordinates.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-full transition-all duration-200 group cursor-pointer ${
                    isSelected ? 'z-30 scale-125' : 'z-10 hover:scale-115'
                  }`}
                  title={`${p.nameEn} (${p.distanceKm}km)`}
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white shadow-md whitespace-nowrap mb-0.5"
                      style={{ backgroundColor: getLoadPinBg(p.loadStatus) }}
                    >
                      {p.type} • {p.distanceKm}km
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white ${
                        isSelected ? 'ring-4 ring-primary/40' : ''
                      }`}
                      style={{ backgroundColor: getLoadPinBg(p.loadStatus) }}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {p.type === 'PSB' ? 'account_balance' : p.type === 'SCA' ? 'assured_workload' : 'storefront'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Current user location mock pin */}
            <div className="absolute left-[45%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md animate-ping" />
              <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-md absolute" />
              <span className="text-[8px] font-bold bg-white/90 text-blue-900 px-1 rounded shadow-2xs mt-3">
                You
              </span>
            </div>
          </div>

          {/* Quick Info on Selected Partner */}
          {selectedPartner && (
            <div className="bg-surface-container-low p-3 rounded-xl text-xs space-y-1">
              <span className="text-[11px] font-bold text-primary block truncate">
                📍 {language === 'hi' ? selectedPartner.nameHi : selectedPartner.nameEn}
              </span>
              <p className="text-on-surface-variant truncate">
                {language === 'hi' ? selectedPartner.addressHi : selectedPartner.addressEn}
              </p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-secondary font-semibold">
                  {selectedPartner.distanceKm} km away
                </span>
                <button
                  onClick={() => setDirectionsModalPartner(selectedPartner)}
                  className="text-primary font-bold hover:underline"
                >
                  View Route →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Cards List (7 cols on desktop) */}
        <section className="lg:col-span-7 space-y-4">
          {sorted.map((partner) => {
            const isSelected = partner.id === selectedPartner.id;
            return (
              <div
                key={partner.id}
                onClick={() => setSelectedPartnerId(partner.id)}
                className={`bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,6,102,0.08)] transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                    : 'border-outline-variant/30 hover:border-primary/40'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-primary px-2 py-0.5 rounded-md mb-1">
                      {language === 'hi' ? partner.typeNameHi : partner.typeNameEn}
                    </span>
                    <h3 className="font-headline text-base md:text-lg font-bold text-on-surface">
                      {language === 'hi' ? partner.nameHi : partner.nameEn}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-body font-bold text-xs md:text-sm text-primary">
                      {t.distanceAway.replace('{d}', partner.distanceKm.toString())}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getLoadBadgeClass(
                      partner.loadStatus
                    )}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLoadPinBg(partner.loadStatus) }}
                    />
                    <span>{language === 'hi' ? partner.loadLabelHi : partner.loadLabelEn}</span>
                  </span>
                </div>

                {/* Fund Utilization Rate Bar */}
                <div className="mt-3 pt-3 border-t border-surface-variant flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-on-surface-variant">{t.fundUtilization}</span>
                    <span className="text-primary font-bold">{partner.fundUtilizationRate}%</span>
                  </div>
                  <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${partner.fundUtilizationRate}%`,
                        backgroundColor:
                          partner.fundUtilizationRate < 60
                            ? '#5aa958'
                            : partner.fundUtilizationRate < 85
                            ? '#ff8f00'
                            : '#ba1a1a',
                      }}
                    />
                  </div>
                </div>

                {/* Address & Contact */}
                <div className="mt-3 text-xs text-on-surface-variant space-y-1">
                  <p className="flex items-start gap-1.5">
                    <span className="material-symbols-outlined text-[15px] shrink-0 text-primary mt-0.5">
                      location_on
                    </span>
                    <span>{language === 'hi' ? partner.addressHi : partner.addressEn}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] shrink-0 text-primary">
                      schedule
                    </span>
                    <span>{partner.timings}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-surface-variant flex gap-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDirectionsModalPartner(partner);
                    }}
                    className="flex-1 min-h-[44px] bg-primary text-on-primary font-body font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">directions</span>
                    <span>{t.getDirections}</span>
                  </button>

                  <a
                    href={`tel:${partner.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 min-h-[44px] bg-surface-container-high text-primary hover:bg-primary-fixed border border-primary/20 font-body font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">call</span>
                    <span>{t.callCenter}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      {/* Directions Simulation Modal */}
      {directionsModalPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-primary/20 animate-pop-glow space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-secondary uppercase">
                  {t.directionsModalTitle}
                </span>
                <h3 className="font-headline text-lg font-bold text-primary">
                  {language === 'hi' ? directionsModalPartner.nameHi : directionsModalPartner.nameEn}
                </h3>
              </div>
              <button
                onClick={() => setDirectionsModalPartner(null)}
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-surface-container-low p-3.5 rounded-xl text-xs space-y-2">
              <p className="font-semibold text-on-surface">
                📌 Address: {language === 'hi' ? directionsModalPartner.addressHi : directionsModalPartner.addressEn}
              </p>
              <p className="text-on-surface-variant">
                🚗 Distance: {directionsModalPartner.distanceKm} km (~{Math.round(directionsModalPartner.distanceKm * 4)} mins via Main Road)
              </p>
              <p className="text-on-surface-variant">
                📞 Contact: {directionsModalPartner.phone} ({directionsModalPartner.timings})
              </p>
            </div>

            <div className="space-y-2 text-xs text-on-surface">
              <h4 className="font-bold text-primary uppercase text-[11px] tracking-wider">
                Step-by-step Route Guidance:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-on-surface-variant leading-relaxed">
                <li>Head towards the nearest State Highway / Ring Road junction.</li>
                <li>Follow signs for District Collectorate / Main Commercial Hub.</li>
                <li>Look for official NSFDC / SCA Channel Partner signboard at Ambedkar Bhawan / Branch building.</li>
                <li>Visit Desk No. 4 (SC Welfare & Micro Credit Division).</li>
              </ol>
            </div>

            <button
              onClick={() => setDirectionsModalPartner(null)}
              className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-container transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
