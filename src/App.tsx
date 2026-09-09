import React, { useState, useEffect } from 'react';
import { Language, ActiveTab, UserProfile, SchemeRecommendation } from './types';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DrawerMenu } from './components/DrawerMenu';
import { HomeScreen } from './components/HomeScreen';
import { IntakeScreen } from './components/IntakeScreen';
import { RecommenderScreen } from './components/RecommenderScreen';
import { CalculatorScreen } from './components/CalculatorScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { LocatorScreen } from './components/LocatorScreen';
import { evaluateEligibility } from './data/schemes';

export function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [intakeInitialMode, setIntakeInitialMode] = useState<'form' | 'chat'>('form');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // User financial profile for national welfare scheme evaluation
  const [userProfile, setUserProfile] = useState<UserProfile>({
    purpose: 'business',
    projectCost: 120000,
    annualIncome: 180000,
    category: 'sc',
    specialOccupation: 'none',
    isPwd: false,
    gender: 'male',
    educationLocation: 'india',
  });

  // Selected scheme for calculator & checklist
  const [selectedScheme, setSelectedScheme] = useState<SchemeRecommendation | null>(() => {
    const { primaryScheme } = evaluateEligibility({
      purpose: 'business',
      projectCost: 120000,
      annualIncome: 180000,
      category: 'sc',
      specialOccupation: 'none',
      isPwd: false,
      gender: 'male',
    });
    return primaryScheme;
  });

  // Automatically update selectedScheme whenever userProfile changes
  useEffect(() => {
    const { primaryScheme } = evaluateEligibility(userProfile);
    setSelectedScheme(primaryScheme);
  }, [userProfile]);

  // Scroll to top on tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const handleStartForm = () => {
    setIntakeInitialMode('form');
    setActiveTab('intake');
  };

  const handleStartChat = () => {
    setIntakeInitialMode('chat');
    setActiveTab('intake');
  };

  const handleProceedToRecommender = () => {
    setActiveTab('schemes');
  };

  const handleUpdateCost = (newCost: number) => {
    setUserProfile((prev) => ({ ...prev, projectCost: newCost }));
  };

  const handleProceedToCalculator = (scheme: SchemeRecommendation) => {
    setSelectedScheme(scheme);
    setActiveTab('calculator');
  };

  const handleProceedToChecklist = (scheme?: SchemeRecommendation | string) => {
    if (typeof scheme === 'object' && scheme !== null) {
      setSelectedScheme(scheme);
    }
    setActiveTab('checklist');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface antialiased selection:bg-secondary-fixed selection:text-secondary">
      {/* Top App Bar */}
      <TopAppBar
        language={language}
        onToggleLanguage={handleToggleLanguage}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showBack={activeTab === 'intake' || (activeTab === 'schemes' && userProfile.projectCost !== 120000)}
        onBack={() => {
          if (activeTab === 'intake') setActiveTab('home');
          else if (activeTab === 'schemes') setActiveTab('intake');
          else setActiveTab('home');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12 pt-2 md:pt-4">
        {activeTab === 'home' && (
          <HomeScreen
            language={language}
            onStartForm={handleStartForm}
            onStartChat={handleStartChat}
            onOpenCalculator={() => setActiveTab('calculator')}
            onOpenLocator={() => setActiveTab('locator')}
          />
        )}

        {activeTab === 'intake' && (
          <IntakeScreen
            language={language}
            profile={userProfile}
            onUpdateProfile={setUserProfile}
            onProceedToRecommender={handleProceedToRecommender}
            initialMode={intakeInitialMode}
          />
        )}

        {activeTab === 'schemes' && (
          <RecommenderScreen
            language={language}
            profile={userProfile}
            onUpdateCost={handleUpdateCost}
            onProceedToCalculator={handleProceedToCalculator}
            onProceedToChecklist={handleProceedToChecklist}
          />
        )}

        {activeTab === 'calculator' && (
          <CalculatorScreen
            language={language}
            preselectedScheme={selectedScheme}
            onProceedToChecklist={(id) => handleProceedToChecklist(id)}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistScreen
            language={language}
            onNavigateToLocator={() => setActiveTab('locator')}
            initialSchemeCategory={
              selectedScheme?.category === 'micro'
                ? 'micro'
                : selectedScheme?.category === 'term'
                ? 'term'
                : selectedScheme?.category === 'education'
                ? 'education'
                : 'all'
            }
          />
        )}

        {activeTab === 'locator' && (
          <LocatorScreen language={language} />
        )}
      </main>

      {/* Bottom Nav Bar (Mobile only) */}
      <BottomNavBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
      />

      {/* Slide-out Drawer */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        language={language}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}
export default App;
