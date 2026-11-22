export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
  };
  android?: {
    allowMixedContent?: boolean;
    backgroundColor?: string;
  };
  loggingBehavior?: 'none' | 'debug' | 'production';
}

const config: CapacitorConfig = {
  appId: 'pl.telepakt.app',
  appName: 'TelePakt',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Bez logowania każdego wywołania wtyczek: okresowe odświeżanie uprawnień zalewało log aplikacji wysyłany przy diagnozie.
  loggingBehavior: 'none',
  android: {
    allowMixedContent: true,
    backgroundColor: '#031634'
  }
};

export default config;
