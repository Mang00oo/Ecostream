import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mang0o.ecostream',
  appName: 'Ecostream',
  webDir: 'build',
  server: {
    // Keep it on HTTP local scheme so it doesn't trigger aggressive web sandbox overrides
    androidScheme: 'http', 
    hostname: 'localhost',
    cleartext: true,
    allowNavigation: [
      '100.*.*.*' // Explicitly permits the webview to execute requests to the Tailscale pool
    ]
  },
  ios: {
    contentInset: 'always'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    StatusBar: {
      overlaysWebView: true // Overlays the webview over the status bar
    },
    SystemBars: {
      insetsHandling: "disable"
    },
  }

};

export default config;
