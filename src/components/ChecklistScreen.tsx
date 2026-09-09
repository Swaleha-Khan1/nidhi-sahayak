import React, { useState } from 'react';
import { Language, DocumentItem } from '../types';
import { translations } from '../data/translations';
import { INITIAL_DOCUMENTS } from '../data/documents';

interface ChecklistScreenProps {
  language: Language;
  onNavigateToLocator: () => void;
  initialSchemeCategory?: 'micro' | 'term' | 'education' | 'all';
}

export const ChecklistScreen: React.FC<ChecklistScreenProps> = ({
  language,
  onNavigateToLocator,
  initialSchemeCategory = 'all',
}) => {
  const t = translations[language];
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'micro' | 'term' | 'education'>(initialSchemeCategory);
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
    const lines = [
      '==================================================',
      '        NSFDC LOAN APPLICATION CHECKLIST         ',
      '    National Scheduled Castes Finance & Dev Corp  ',
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
    link.download = `NSFDC_Checklist_${selectedFilter}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
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
                <label className="flex items-start gap-3.5 cursor-pointer select-none flex-1">
                  <input
                    type="checkbox"
                    checked={doc.isReady}
                    onChange={() => toggleDocReady(doc.id)}
                    className="mt-1 w-5 h-5 rounded-md text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-headline text-base font-bold transition-colors ${
                          doc.isReady ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {language === 'hi' ? doc.titleHi : doc.titleEn}
                      </span>
                      {doc.isMandatory && (
                        <span className="text-[10px] bg-error-container text-on-error-container px-1.5 py-0.5 rounded font-bold">
                          Mandatory
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-on-surface-variant mt-0.5">
                      {language === 'hi' ? doc.descHi : doc.descEn}
                    </p>
                  </div>
                </label>

                {/* Status Badge */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      doc.isReady
                        ? 'bg-tertiary-fixed-dim text-on-tertiary-container'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {doc.isReady ? 'check' : 'pending'}
                    </span>
                    <span>{doc.isReady ? t.verifiedBadge : t.pendingBadge}</span>
                  </span>

                  <button
                    onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                    className="text-[11px] text-primary hover:underline font-semibold flex items-center gap-0.5 mt-1"
                  >
                    <span>{isExpanded ? 'Less info' : 'Guidelines'}</span>
                    <span className="material-symbols-outlined text-[14px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Expandable Help Guidelines */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-surface-variant text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl flex items-start gap-2 animate-pop-glow">
                  <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">
                    lightbulb
                  </span>
                  <span>{language === 'hi' ? doc.helpTipHi : doc.helpTipEn}</span>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Action Buttons */}
      <section className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleDownload}
          className="flex-1 bg-surface-container-lowest text-primary border border-primary/30 rounded-xl min-h-[50px] font-body font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-fixed/40 transition-all shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">download</span>
          <span>{t.downloadChecklist}</span>
        </button>

        <button
          onClick={onNavigateToLocator}
          className="flex-1 bg-primary text-on-primary rounded-xl min-h-[50px] font-body font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary-container active:scale-[0.98] transition-all shadow-xs cursor-pointer"
        >
          <span>{t.findPartnerToSubmit}</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>
      </section>

      {downloadToast && (
        <div className="bg-tertiary-container text-on-tertiary px-4 py-2.5 rounded-xl text-xs font-bold text-center animate-pop-glow">
          ✓ {t.downloadSuccess}
        </div>
      )}
    </div>
  );
};
