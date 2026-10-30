export interface AppNameOption {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  vibe: 'legal' | 'tech' | 'direct' | 'polish';
  description: string;
  pros: string[];
  cons: string[];
  appStoreRank: number;
  domainSuggestions: string[];
  suggestedAccentColor: string;
}

export type ScriptCategory =
  | 'marketer-full'
  | 'recording-notice'
  | 'short-rejection'
  | 'bank-fraud'
  | 'debt-collector'
  | 'b2b-agreement'
  | 'harassment-stalking'
  | 'consumer-complaint'
  | 'emergency-exit'
  | 'custom';

export interface LegalScript {
  id: string;
  title: string;
  shortDesc: string;
  category: ScriptCategory;
  legalAct: string;
  badge: string;
  durationEst: string;
  text: string;
  legalBreakdown: {
    article: string;
    description: string;
    penalty: string;
  }[];
  audioBlobUrl?: string;
  recordedAt?: string;
  isUserRecorded?: boolean;
  autoHangup?: boolean;
  enabled?: boolean;
  orderIndex?: number;
}

export interface UseCaseDefinition {
  id: string;
  title: string;
  targetUser: string;
  tagline: string;
  iconName: string;
  category: ScriptCategory;
  problem: string;
  solution: string;
  legalBasis: string;
  scriptPreview: string;
  revenuePotential: 'high' | 'very_high' | 'viral';
  realWorldScenario: string;
  keyBenefits: string[];
}

export type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive' | 'nextcloud' | 'icloud';

export interface CallLog {
  id: string;
  callerNumber: string;
  callerName?: string;
  spamCategory: string;
  spamRisk: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  durationSeconds: number;
  botConnectedSeconds: number;
  scriptUsed: string;
  recordingUrl?: string;
  status: 'objection_delivered' | 'caller_hung_up' | 'recorded_full';
  complaintFiled?: boolean;
  downloadedLocally?: boolean;
  downloadTimestamp?: string;
  deletedFromServer?: boolean;
  deletedFromServerTimestamp?: string;
  cloudSyncedProvider?: CloudProvider | null;
  cloudSyncTimestamp?: string;
  serverRetentionExpiry?: string;
}

export interface ServerRetentionSettings {
  subscriptionActive: boolean;
  retentionDays: number;
  deleteImmediatelyAfterLocalSave: boolean;
  defaultCloudProvider: CloudProvider;
  autoBackupToCloud: boolean;
}

export interface PythonCodeFile {
  path: string;
  filename: string;
  description: string;
  language: string;
  content: string;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  isApproved: boolean;
  isFeatured: boolean;
  verifiedSubscriber: boolean;
  deviceType: 'Android' | 'iPhone' | 'Web';
  spamTypeBlocked: string;
  adminReply?: string;
}

export interface IntegrationCredential {
  id: string;
  category: 'twilio' | 'google_play' | 'apple_store' | 'cloud_storage' | 'tts_speech';
  name: string;
  key: string;
  valueMasked: string;
  status: 'active' | 'pending' | 'error';
  lastTested?: string;
  description: string;
  instructions: string;
}

export interface UserCredentialItem {
  id: string;
  email: string;
  phone: string;
  plan: 'Darmowy (3 dni)' | 'Miesięczny (19,99 zł)' | 'Roczny Tarcza (179 zł)' | 'B2B Firma (499 zł)';
  status: 'active' | 'suspended' | 'cancelled';
  joinedDate: string;
  quotaMinutesUsed: number;
  totalMinutes: number;
  provider: 'Google Play IAP' | 'Apple App Store' | 'Web Direct (telepakt.pl)';
}
