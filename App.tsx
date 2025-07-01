
import React, { useState, useCallback, useEffect } from 'react';
import { AppView, User, UserData, ActivityLog } from './types.ts';
import { generatePrompt } from './services/geminiService.ts';
import * as storage from './services/storageService.ts';
import InterestSelector from './components/InterestSelector.tsx';
import PracticeSession from './components/PracticeSession.tsx';
import Loader from './components/Loader.tsx';
import { LogoIcon, AccessibilityIcon, HomeIcon, GuideIcon, LogoutIcon, ProgressIcon } from './constants.tsx';
import LandingPage from './components/LandingPage.tsx';
import SignUpPage from './components/SignUpPage.tsx';
import HomePage from './components/HomePage.tsx';
import GuidePage from './components/GuidePage.tsx';
import LoginPage from './components/LoginPage.tsx';
import ProgressPage from './components/ProgressPage.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  const [prompt, setPrompt] = useState<string>('');
  const [interest, setInterest] = useState<string>('');
  const [exerciseType, setExerciseType] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [isHighContrast]);

  const updateUserData = useCallback((username: string) => {
    const data = storage.getUserData(username);
    setUserData(data);
  }, []);

  useEffect(() => {
    const user = storage.getCurrentUser();
    if (user && user.username) {
      setCurrentUser(user);
      updateUserData(user.username);
      setView(AppView.HOME);
    }
    setIsLoading(false);
  }, [updateUserData]);

  const navigateTo = useCallback((newView: AppView) => {
    setError(null);
    setView(newView);
  }, []);
  
  const handleLogout = useCallback(() => {
    storage.logoutUser();
    setCurrentUser(null);
    setUserData(null);
    navigateTo(AppView.LANDING);
  }, [navigateTo]);

  const handleSignup = useCallback((username: string, email: string) => {
    try {
      const newUser = storage.signupUser(username, email, 'password'); // Password ignored for now
      setCurrentUser(newUser);
      updateUserData(newUser.username);
      navigateTo(AppView.HOME);
    } catch (e: any) {
      setError(e.message);
    }
  }, [navigateTo, updateUserData]);

  const handleLogin = useCallback((email: string) => {
    try {
      const user = storage.loginUser(email, 'password'); // Password ignored for now
      setCurrentUser(user);
      updateUserData(user.username);
      navigateTo(AppView.HOME);
    } catch (e: any) {
      setError(e.message);
    }
  }, [navigateTo, updateUserData]);

  const handleStartPractice = useCallback(async (selectedExerciseType: string, selectedInterest: string) => {
    setInterest(selectedInterest);
    setExerciseType(selectedExerciseType);
    setIsLoading(true);
    setError(null);
    try {
      const generatedPrompt = await generatePrompt(selectedExerciseType, selectedInterest);
      setPrompt(generatedPrompt);
      navigateTo(AppView.PRACTICE_SESSION);
    } catch (e) {
      setError('Failed to generate a prompt. Please check your connection and try again.');
      console.error(e);
      navigateTo(AppView.HOME); // Go back home on error
    } finally {
      setIsLoading(false);
    }
  }, [navigateTo]);

  const handleSessionComplete = useCallback((sessionData: Omit<ActivityLog, 'id' | 'date'>) => {
    if (currentUser) {
      storage.recordActivity(currentUser.username, sessionData);
      updateUserData(currentUser.username);
    }
    // Don't navigate away, let the user see their feedback.
    // The PracticeSession component handles the view after completion.
  }, [currentUser, updateUserData]);
  
  const handleGoBackToHome = useCallback(() => {
    navigateTo(AppView.HOME);
  }, [navigateTo]);

  const renderContent = () => {
    if (isLoading) {
      return <Loader text="Launching Pro-Speech..." />;
    }
    if (error && view !== AppView.SIGNUP && view !== AppView.LOGIN) {
       return (
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={() => setError(null)} // just clear error, let user decide next step
            className="mt-4 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Acknowledge
          </button>
        </div>
      );
    }
    switch (view) {
      case AppView.LANDING:
        return <LandingPage onNavigate={navigateTo} />;
      case AppView.SIGNUP:
        return <SignUpPage onSignup={handleSignup} onNavigate={navigateTo} error={error} />;
       case AppView.LOGIN:
        return <LoginPage onLogin={handleLogin} onNavigate={navigateTo} error={error} />;
      case AppView.HOME:
        return userData ? <HomePage userData={userData} onNavigate={navigateTo} /> : <Loader text="Loading user data..." />;
      case AppView.GUIDE:
        return <GuidePage onNavigate={navigateTo} />;
      case AppView.PROGRESS:
        return currentUser ? <ProgressPage username={currentUser.username} onNavigate={navigateTo}/> : <LoginPage onLogin={handleLogin} onNavigate={navigateTo} error={error} />;
      case AppView.PRACTICE_SETUP:
        return <InterestSelector onStartPractice={handleStartPractice} />;
      case AppView.PRACTICE_SESSION:
        return <PracticeSession prompt={prompt} onGoBack={handleGoBackToHome} interest={interest} exerciseType={exerciseType} onSessionComplete={handleSessionComplete} />;
      default:
        return <LandingPage onNavigate={navigateTo} />;
    }
  };

  const navClass = "inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-transparent text-gray-400 hover:bg-slate-800 hover:text-gray-200 transition-colors";
  const activeNavClass = "bg-slate-800 text-gray-100";

  return (
    <main className="bg-slate-900 min-h-screen text-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-col flex-grow">
        <header className="flex items-center justify-between mb-8 sm:mb-12 w-full">
          <div className="flex items-center justify-start cursor-pointer" onClick={() => navigateTo(currentUser ? AppView.HOME : AppView.LANDING)}>
            <LogoIcon className="h-10 w-10 mr-3"/>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#FF6B6B] to-[#45B7D1]">
              Pro-Speech
            </h1>
          </div>
          {currentUser && userData && (
            <nav className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 text-amber-400 font-bold mr-4">
                    <span>🔥</span>
                    <span>{userData.streak} Day Streak</span>
                </div>
                <button onClick={() => navigateTo(AppView.HOME)} className={`${navClass} ${view === AppView.HOME ? activeNavClass : ''}`} aria-label="Home"><HomeIcon className="w-5 h-5"/> <span className="hidden sm:inline">Home</span></button>
                <button onClick={() => navigateTo(AppView.PROGRESS)} className={`${navClass} ${view === AppView.PROGRESS ? activeNavClass : ''}`} aria-label="Progress"><ProgressIcon className="w-5 h-5"/> <span className="hidden sm:inline">Progress</span></button>
                <button onClick={() => navigateTo(AppView.GUIDE)} className={`${navClass} ${view === AppView.GUIDE ? activeNavClass : ''}`} aria-label="Guide"><GuideIcon className="w-5 h-5"/> <span className="hidden sm:inline">Guide</span></button>
                <button onClick={handleLogout} className={navClass} aria-label="Log out"><LogoutIcon className="w-5 h-5"/> <span className="hidden sm:inline">Logout</span></button>
            </nav>
          )}
        </header>
        <div className="w-full flex-grow flex flex-col justify-center">{renderContent()}</div>
        <footer className="w-full mt-auto pt-8 text-center">
            <button
                onClick={() => setIsHighContrast(prev => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-700 text-gray-400 hover:bg-slate-800 hover:text-gray-200 transition-colors"
                aria-pressed={isHighContrast}
                aria-label={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            >
                <AccessibilityIcon className="w-5 h-5"/>
                <span>{isHighContrast ? 'Disable High Contrast' : 'Enable High Contrast'}</span>
            </button>
        </footer>
      </div>
      {/* TODO: Add progress tracking and gamification features here in a future update. */}
    </main>
  );
};

export default App;