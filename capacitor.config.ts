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
}

const config: CapacitorConfig = {
  appId: 'pl.telepakt.app',
  appName: 'TelePakt',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#031634'
  }
};

export default config;
