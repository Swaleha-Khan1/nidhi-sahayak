import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { DrawerMenu } from './components/DrawerMenu';
import { HomeScreen } from './components/HomeScreen';
import { IntakeScreen } from './components/IntakeScreen';
import { RecommenderScreen } from './components/RecommenderScreen';
import { CalculatorScreen } from './components/CalculatorScreen';
import { ChecklistScreen } from './components/ChecklistScreen';
import { LocatorScreen } from './components/LocatorScreen';

function AppContent() {
  const {
    language,
    toggleLanguage,
    activeTab,
    setActiveTab,
    isDrawerOpen,
    setIsDrawerOpen,
  } = useApp();

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-surface flex flex-col text-on-surface antialiased selection:bg-secondary-fixed selection:text-secondary">
      {/* Top App Bar */}
      <TopAppBar
        language={language}
        onToggleLanguage={toggleLanguage}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showBack={activeTab !== 'home'}
        onBack={() => {
          if (activeTab === 'intake') setActiveTab('home');
          else if (activeTab === 'schemes') setActiveTab('intake');
          else if (activeTab === 'calculator') setActiveTab('schemes');
          else if (activeTab === 'checklist') setActiveTab('calculator');
          else setActiveTab('home');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-12 pt-2 md:pt-4">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'intake' && <IntakeScreen />}
        {activeTab === 'schemes' && <RecommenderScreen />}
        {activeTab === 'calculator' && <CalculatorScreen />}
        {activeTab === 'checklist' && <ChecklistScreen />}
        {activeTab === 'locator' && <LocatorScreen />}
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

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
