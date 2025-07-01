// These interfaces are for the Web Speech API, which is not yet standard in TypeScript
export interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
}

export interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
}

export interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Augment the window object to include vendor-prefixed SpeechRecognition APIs
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
    Chart: any; // Add Chart.js to global window object
  }
}

export enum AppView {
  LANDING,
  SIGNUP,
  LOGIN,
  HOME,
  GUIDE,
  PROGRESS,
  PRACTICE_SETUP,
  PRACTICE_SESSION,
}

export interface AnalysisData {
  wpm: number;
  fillerCount: number;
  wordCount: number;
}

export interface User {
  username: string;
  email: string;
}

export interface UserData extends User {
    streak: number;
    isNewUser: boolean;
}

export interface ActivityLog {
    id: string;
    date: string; // ISO date string (e.g., "2023-10-27")
    exerciseType: string;
    interest: string;
    analysis: AnalysisData;
    transcript: string;
}