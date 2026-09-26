import React, { useState } from 'react';
import { Language, Partner, AgencyType } from '../types';
import { translations } from '../data/translations';
import { getSamplePartnersForLocation, VERIFIED_CITIES, PARTNERS_METADATA } from '../data/partners';
import { useApp } from '../context/AppContext';

interface LocatorScreenProps {
  language?: Language;
}

export const LocatorScreen: React.FC<LocatorScreenProps> = () => {
  const { language, selectedScheme, userProfile, updateUserProfile } = useApp();
  const t = translations[language];

  // Resolve verified partners dynamically based on user's entered city
  const {
    partners: verifiedPartners,
    isLocationSet,
    matchedCity,
    hasVerifiedData,
    searchedCity,
  } = getSamplePartnersForLocation(userProfile.city);

  const [filterType, setFilterType] = useState<'ALL' | AgencyType>('ALL');
  const [selectedPartnerModal, setSelectedPartnerModal] = useState<Partner | null>(null);

  // Filter by agency type
  const filtered = verifiedPartners.filter((p) => {
    if (filterType === 'ALL') return true;
    return p.agencyType === filterType;
  });

  const getAgencyTypeBadgeClass = (type: AgencyType) => {
    switch (type) {
      case 'SCA':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'RRB':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'Nationalised Bank':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      default:
        return 'bg-surface-container-high text-on-surface';
    }
  };

  return (
    <div className="w-full max-w-[920px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary">
            {t.locatorTitle}
          </h2>
          <a
            href={PARTNERS_METADATA.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>{t.officialSourceLabel}</span>
          </a>
        </div>
        <p className="font-body text-xs md:text-sm text-on-surface-variant">
          {t.locatorSubtitle}
        </p>
      </div>

      {/* Official MoSJE Source Transparency Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-on-surface shadow-xs">
        <span className="material-symbols-outlined text-primary text-xl shrink-0 mt-0.5">
          verified
        </span>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-primary text-sm">
              Official MoSJE Channelizing Agencies Directory
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-on-primary">
              100% Real Govt Data
            </span>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {t.locatorDisclaimer}
          </p>
        </div>
      </div>

      {/* Linked Scheme Routing Banner if user came from recommendation */}
      {selectedScheme && (
        <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">hub</span>
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary text-on-primary mr-2">
                {selectedScheme.agencyShort}
              </span>
              <span className="font-bold text-sm text-primary">
                {language === 'hi' ? selectedScheme.nameHi : selectedScheme.nameEn}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-secondary bg-secondary-fixed/50 px-2.5 py-1 rounded-full shrink-0">
            Channel Routing
          </span>
        </div>
      )}

      {/* City / District Selector (ALWAYS VISIBLE & EDITABLE - Requirement 2) */}
      <div className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-4 md:p-5 flex flex-col gap-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="locator-city-input" className="font-body font-bold text-sm text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">location_on</span>
            <span>{t.changeCityLabel}</span>
          </label>
          {userProfile.city && (
            <button
              type="button"
              onClick={() => updateUserProfile({ city: '' })}
              className="text-xs font-bold text-error hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              <span>{t.clearLocation} ({userProfile.city})</span>
            </button>
          )}
        </div>

        {/* Input box - always editable and pre-filled */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-primary text-lg pointer-events-none">
            search
          </span>
          <input
            id="locator-city-input"
            type="text"
            list="verified-cities-datalist"
            value={userProfile.city || ''}
            onChange={(e) => updateUserProfile({ city: e.target.value })}
            placeholder={t.enterCityPlaceholder}
            className="w-full min-h-[48px] pl-11 pr-10 rounded-xl border border-primary/30 bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-on-surface font-semibold outline-none transition-all"
          />
          {userProfile.city && (
            <button
              type="button"
              onClick={() => updateUserProfile({ city: '' })}
              aria-label="Clear city filter"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
          <datalist id="verified-cities-datalist">
            {VERIFIED_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {/* Quick select buttons for all 8 verified administrative centers */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-on-surface-variant">
            {t.selectVerifiedCity}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {VERIFIED_CITIES.map((c) => {
              const isSelected =
                (matchedCity && matchedCity.toLowerCase() === c.toLowerCase()) ||
                (userProfile.city && userProfile.city.trim().toLowerCase() === c.toLowerCase());
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => updateUserProfile({ city: c })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary text-on-primary border-primary shadow-xs'
                      : 'bg-surface-bright text-on-surface border-outline-variant/40 hover:bg-surface-container hover:border-primary/30'
                  }`}
                >
                  📍 {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agency Type Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'ALL'
              ? 'bg-primary text-on-primary border-primary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container'
          }`}
        >
          {t.allTypes} ({verifiedPartners.length})
        </button>
        <button
          onClick={() => setFilterType('SCA')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'SCA'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container'
          }`}
        >
          SCAs ({verifiedPartners.filter((p) => p.agencyType === 'SCA').length})
        </button>
        <button
          onClick={() => setFilterType('RRB')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'RRB'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container'
          }`}
        >
          RRBs ({verifiedPartners.filter((p) => p.agencyType === 'RRB').length})
        </button>
        <button
          onClick={() => setFilterType('Nationalised Bank')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'Nationalised Bank'
              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
              : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container'
          }`}
        >
          Nationalised Banks ({verifiedPartners.filter((p) => p.agencyType === 'Nationalised Bank').length})
        </button>
      </div>

      {/* Banner indicating current view scope */}
      <div className="text-xs font-bold text-on-surface-variant flex items-center justify-between">
        <span>
          {isLocationSet && matchedCity
            ? t.verifiedBannerTitle.replace('{city}', matchedCity)
            : t.allCitiesBannerTitle}
        </span>
        <span className="text-primary">
          {filtered.length} {filtered.length === 1 ? 'partner' : 'partners'} shown
        </span>
      </div>

      {/* UNVERIFIED CITY EMPTY STATE (Requirement 1) */}
      {!hasVerifiedData && searchedCity && (
        <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">location_off</span>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-headline text-lg font-bold text-amber-900 dark:text-amber-200">
              {t.noVerifiedPartnersTitle.replace('{city}', searchedCity)}
            </h3>
            <p className="text-xs text-amber-950/80 dark:text-amber-200/80 leading-relaxed font-medium">
              {t.noVerifiedPartnersDesc}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {VERIFIED_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => updateUserProfile({ city: c })}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-bright text-primary border border-primary/20 hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
              >
                📍 {c}
              </button>
            ))}
          </div>
          <div className="pt-2">
            <a
              href={PARTNERS_METADATA.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>{t.viewSourcePortal}</span>
            </a>
          </div>
        </div>
      )}

      {/* VERIFIED PARTNERS CARDS GRID */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((partner) => (
            <div
              key={partner.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,6,102,0.06)] border border-outline-variant/30 flex flex-col justify-between gap-4 transition-all hover:border-primary/40 hover:shadow-md"
            >
              {/* Card Header & Badges */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Agency Type */}
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${getAgencyTypeBadgeClass(partner.agencyType)}`}>
                      {partner.agencyType}
                    </span>

                    {/* State / City */}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                      📍 {partner.city}, {partner.state}
                    </span>
                  </div>

                  {/* Verified MoSJE Badge with source link */}
                  <a
                    href={partner.sourceReference}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Sourced from official MoSJE portal (${partner.sourceReference})`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 shrink-0 transition-all"
                  >
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>{t.verifiedMoSJEBadge}</span>
                  </a>
                </div>

                {/* Agency Name */}
                <h3 className="font-headline text-base font-bold text-on-surface leading-snug">
                  {partner.agencyName}
                </h3>

                {/* Caveat / Administrative Note if present (Requirement 1) */}
                {partner.note && (
                  <div className="bg-amber-500/10 border-l-4 border-amber-500 p-2.5 rounded-r-lg text-[11px] text-amber-950 dark:text-amber-200 space-y-0.5">
                    <span className="font-bold flex items-center gap-1 text-amber-900 dark:text-amber-100">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      <span>Source Caveat / Note:</span>
                    </span>
                    <p className="leading-relaxed font-medium">{partner.note}</p>
                  </div>
                )}

                {/* Official Address */}
                <div className="text-xs text-on-surface-variant flex items-start gap-2 pt-1">
                  <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">
                    apartment
                  </span>
                  <span className="leading-relaxed">{partner.address}</span>
                </div>

                {/* Contact List */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {/* Phone */}
                  <div className="flex items-start gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">
                      call
                    </span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 font-semibold">
                      {partner.phone.map((ph, idx) => (
                        <a
                          key={idx}
                          href={`tel:${ph}`}
                          className="text-primary hover:underline hover:text-primary-container"
                        >
                          {ph}
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* Email */}
                  {partner.email && partner.email.length > 0 && (
                    <div className="flex items-start gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">
                        mail
                      </span>
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {partner.email.map((em, idx) => (
                          <a
                            key={idx}
                            href={`mailto:${em}`}
                            className="text-primary hover:underline text-[11px] break-all"
                          >
                            {em}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Website */}
                  {partner.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-primary shrink-0">
                        language
                      </span>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-bold hover:underline truncate"
                      >
                        {partner.website}
                      </a>
                    </div>
                  )}

                  {/* Fax */}
                  {partner.fax && (
                    <div className="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm text-outline-variant shrink-0">
                        print
                      </span>
                      <span>Fax: {partner.fax}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/20 flex gap-2">
                {partner.phone.length > 0 && (
                  <a
                    href={`tel:${partner.phone[0]}`}
                    className="flex-1 min-h-[40px] bg-primary text-on-primary font-body font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary-container active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                    <span>{t.callOffice}</span>
                  </a>
                )}
                {partner.email.length > 0 && (
                  <a
                    href={`mailto:${partner.email[0]}`}
                    className="flex-1 min-h-[40px] bg-surface-container-high text-primary hover:bg-primary-fixed border border-primary/20 font-body font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span>{t.sendEmail}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPartnerModal(partner)}
                  className="px-3 min-h-[40px] bg-surface-bright text-on-surface-variant hover:text-primary border border-outline-variant/40 rounded-xl flex items-center justify-center text-xs cursor-pointer"
                  title="View full administrative details"
                >
                  <span className="material-symbols-outlined text-sm">info</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Details Modal */}
      {selectedPartnerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-primary/20 animate-pop-glow space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getAgencyTypeBadgeClass(selectedPartnerModal.agencyType)}`}>
                    {selectedPartnerModal.agencyType}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Verified — MoSJE
                  </span>
                </div>
                <h3 className="font-headline text-lg font-bold text-primary">
                  {selectedPartnerModal.agencyName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPartnerModal(null)}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-primary cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {selectedPartnerModal.note && (
              <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-lg text-xs text-amber-950 dark:text-amber-200">
                <span className="font-bold block mb-0.5">⚠️ Caveat / Note:</span>
                <p>{selectedPartnerModal.note}</p>
              </div>
            )}

            <div className="bg-surface-container-low p-4 rounded-xl text-xs space-y-3">
              <div>
                <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-primary">
                  Official Address:
                </span>
                <p className="text-on-surface-variant mt-0.5">{selectedPartnerModal.address}</p>
                <p className="text-on-surface-variant font-semibold">
                  State: {selectedPartnerModal.state} | City: {selectedPartnerModal.city}
                </p>
              </div>

              <div>
                <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-primary">
                  Phone Numbers:
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {selectedPartnerModal.phone.map((ph, i) => (
                    <a key={i} href={`tel:${ph}`} className="block text-primary hover:underline font-semibold">
                      📞 {ph}
                    </a>
                  ))}
                </div>
              </div>

              {selectedPartnerModal.email && selectedPartnerModal.email.length > 0 && (
                <div>
                  <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-primary">
                    Email Addresses:
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {selectedPartnerModal.email.map((em, i) => (
                      <a key={i} href={`mailto:${em}`} className="block text-primary hover:underline">
                        ✉️ {em}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedPartnerModal.website && (
                <div>
                  <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-primary">
                    Official Website:
                  </span>
                  <a
                    href={selectedPartnerModal.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-bold hover:underline block mt-0.5"
                  >
                    🔗 {selectedPartnerModal.website}
                  </a>
                </div>
              )}

              {selectedPartnerModal.fax && (
                <div>
                  <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-primary">
                    Fax Number:
                  </span>
                  <p className="text-on-surface-variant mt-0.5">📠 {selectedPartnerModal.fax}</p>
                </div>
              )}

              <div className="pt-2 border-t border-outline-variant/20">
                <span className="font-bold text-on-surface block text-[11px] uppercase tracking-wider text-secondary">
                  Data Provenance:
                </span>
                <p className="text-[11px] text-on-surface-variant mt-0.5">
                  Direct official record from Ministry of Social Justice & Empowerment (MoSJE).
                </p>
                <a
                  href={selectedPartnerModal.sourceReference}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <span>{selectedPartnerModal.sourceReference}</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              </div>
            </div>

            <button
              onClick={() => setSelectedPartnerModal(null)}
              className="w-full py-2.5 bg-primary text-on-primary font-bold text-xs rounded-xl hover:bg-primary-container transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
