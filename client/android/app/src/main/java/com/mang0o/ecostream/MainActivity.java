package com.mang0o.ecostream;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Wait for the native Capacitor bridge to boot the WebView instance
        WebView webView = this.getBridge().getWebView();

        if (webView != null) {
            WebSettings settings = webView.getSettings();

            // 2. FORCE the Android WebView to allow loading http:// Tailscale assets inside your app
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
    }
}
