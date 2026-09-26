import React, { useState } from 'react';
import { DocumentItem } from '../types';
import { translations } from '../data/translations';
import { INITIAL_DOCUMENTS } from '../data/documents';
import { useApp } from '../context/AppContext';

interface ChecklistScreenProps {
  language?: 'en' | 'hi';
  onNavigateToLocator?: () => void;
  initialSchemeCategory?: 'micro' | 'term' | 'education' | 'all';
}

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  onNavigateToLocator,
  initialSchemeCategory,
}) => {
  const {
    language,
    selectedScheme,
    setActiveTab,
  } = useApp();

  const t = translations[language];
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);

  // Default filter based on selectedScheme if present
  const defaultFilter = initialSchemeCategory || (
    selectedScheme?.category === 'micro'
      ? 'micro'
      : selectedScheme?.category === 'term'
      ? 'term'
      : selectedScheme?.category === 'education'
      ? 'education'
      : 'all'
  );

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'micro' | 'term' | 'education'>(defaultFilter);
  const [downloadToast, setDownloadToast] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    if (selectedFilter === 'all') return true;
    return doc.requiredFor.includes(selectedFilter);
  });

  const totalCount = filteredDocs.length;
  const readyCount = filteredDocs.filter((d) => d.isReady).length;
  const progressPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const toggleDocReady = (id: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, isReady: !doc.isReady } : doc))
    );
  };

  const handleDownload = () => {
    const schemeTitle = selectedScheme
      ? `${language === 'hi' ? selectedScheme.nameHi : selectedScheme.nameEn} (${selectedScheme.agencyShort})`
      : 'NATIONAL SCHEME MATCH';

    const lines = [
      '==================================================',
      '        NATIONAL WELFARE LOAN CHECKLIST           ',
      `    Scheme: ${schemeTitle}`,
      '==================================================',
      '',
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Scheme Scope: ${selectedFilter.toUpperCase()}`,
      `Readiness: ${readyCount} / ${totalCount} Documents Ready (${progressPercent}%)`,
      '',
      '---------------- DOCUMENT STATUS ----------------',
      ...filteredDocs.map((doc, idx) => {
        const status = doc.isReady ? '[✓ READY]' : '[ ] PENDING';
        const title = language === 'hi' ? doc.titleHi : doc.titleEn;
        const desc = language === 'hi' ? doc.descHi : doc.descEn;
        return `${idx + 1}. ${status} ${title}\n   Note: ${desc}`;
      }),
      '',
      '-------------------------------------------------',
      'Helpline: 1800-11-2001 (Toll-Free)',
      'Official Portal: https://nsfdc.nic.in',
      '==================================================',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Loan_Checklist_${selectedFilter}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
  };

  const handleGoToLocator = () => {
    if (onNavigateToLocator) {
      onNavigateToLocator();
    } else {
      setActiveTab('locator');
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 md:px-6 py-4 md:py-6 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary mb-1">
          {t.checklistTitle}
        </h2>
        <p className="font-body text-sm text-on-surface-variant">
          {t.checklistSubtitle}
        </p>
      </div>

      {/* Linked Scheme Banner if selected */}
      {selectedScheme && (
        <div className="bg-primary/10 border-2 border-primary/30 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-xl">folder_special</span>
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary text-on-primary mr-2">
                {selectedScheme.agencyShort}
              </span>
              <span className="font-bold text-sm text-primary">
                {language === 'hi' ? selectedScheme.nameHi : selectedScheme.nameEn}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant hidden sm:inline">
            Active Selection
          </span>
        </div>
      )}

      {/* Scheme Filter Selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: language === 'hi' ? 'सभी दस्तावेज़ (All)' : 'All Documents' },
          { id: 'micro', label: language === 'hi' ? 'माइक्रो फाइनेंस (≤1.4L)' : 'Micro Finance (≤1.4L)' },
          { id: 'term', label: language === 'hi' ? 'टर्म लोन (Term Loan)' : 'Term Loan (>1.4L)' },
          { id: 'education', label: language === 'hi' ? 'शिक्षा ऋण (Education)' : 'Education Loan' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFilter(f.id as any)}
            className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === f.id
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Dynamic Progress Card */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_16px_rgba(0,6,102,0.08)] border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="font-body font-bold text-sm text-on-surface">
            {t.docsReadyText.replace('{ready}', readyCount.toString()).replace('{total}', totalCount.toString())}
          </span>
          <span className="font-headline text-lg font-bold text-primary">
            {progressPercent}%
          </span>
        </div>

        <div className="w-full bg-surface-variant rounded-full h-3 overflow-hidden">
          <div
            className="bg-tertiary-container h-3 rounded-full transition-all duration-400"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Document Items List */}
      <section className="space-y-3">
        {filteredDocs.map((doc) => {
          const isExpanded = expandedDocId === doc.id;
          return (
            <div
              key={doc.id}
              className={`bg-surface-container-lowest rounded-2xl p-4 transition-all duration-200 border ${
                doc.isReady
                  ? 'border-tertiary-container/40 shadow-xs'
                  : 'border-outline-variant/30 shadow-[0_2px_8px_rgba(0,6,102,0.04)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDocReady(doc.id)}
                    className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      doc.isReady
                        ? 'bg-tertiary-container text-on-tertiary'
                        : 'border-2 border-outline-variant/60 hover:border-primary'
                    }`}
                  >
                    {doc.isReady && (
                      <span className="material-symbols-outlined text-base">check</span>
                    )}
                  </button>

                  <div>
                    <h3
                      className={`font-headline text-base font-bold transition-colors cursor-pointer ${
                        doc.isReady ? 'line-through text-on-surface-variant/70' : 'text-on-surface'
                      }`}
                      onClick={() => toggleDocReady(doc.id)}
                    >
                      {language === 'hi' ? doc.titleHi : doc.titleEn}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {language === 'hi' ? doc.descHi : doc.descEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                  className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined text-lg">
                    {isExpanded ? 'expand_less' : 'info'}
                  </span>
                </button>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-surface-variant/60 text-xs text-on-surface-variant space-y-1 bg-surface-container-low/50 p-3 rounded-xl">
                  <div className="font-bold text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    <span>Document Tips:</span>
                  </div>
                  <p>
                    {language === 'hi'
                      ? 'सुनिश्चित करें कि प्रति स्पष्ट और स्व-प्रमाणित हो। स्कैन कॉपी 2MB से कम होनी चाहिए।'
                      : 'Ensure copies are legible, self-attested, and recent. Original documents must be presented at the verification bank branch.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Download and Locator Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 bg-primary text-on-primary py-3 px-4 rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs cursor-pointer min-h-[48px]"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          <span>{t.downloadChecklist}</span>
        </button>

        <button
          type="button"
          onClick={handleGoToLocator}
          className="flex-1 bg-surface-container-high hover:bg-primary-fixed text-primary border border-primary/20 py-3 px-4 rounded-xl font-body font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
        >
          <span>{t.findPartnerToSubmit}</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </div>

      {downloadToast && (
        <div className="bg-tertiary-container text-on-tertiary px-4 py-2.5 rounded-xl text-xs font-bold text-center animate-pop-glow">
          ✓ {t.downloadSuccess}
        </div>
      )}
    </div>
  );
};
