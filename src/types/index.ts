export type ActiveMode = 'default' | 'text-sync' | 'video-summary' | 'drawing' | 'napkin-sketch' | 'tutor' | 'recording' | 'profile' | 'problem-assistant' | 'search' | 'confirmation-hud'
export type StudentStatus = 'college' | 'highschool' | 'none'

export interface DetectedEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  source?: string;
}

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  onboarded: boolean;
  status: StudentStatus;
  school: string;
  gradYear: string;
  agreedToTerms: boolean;
  googleDriveConnected?: boolean;
  googleDriveAccessToken?: string;
}
