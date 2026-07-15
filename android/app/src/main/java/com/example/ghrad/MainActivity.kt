package com.example.ghrad

import android.Manifest
import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.webkit.ConsoleMessage
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.GeolocationPermissions
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.BackHandler
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ghrad.theme.GhradTheme

class MainActivity : ComponentActivity() {
  private var currentTopPadding = 0f
  private var varBottomPadding = 0f

  // Request location permissions at launch so the WebView GPS works instantly
  private val requestLocationPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestMultiplePermissions()
  ) { _ -> }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    requestLocationPermissionLauncher.launch(
      arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
      )
    )

    enableEdgeToEdge()
    setContent {
      GhradTheme {
        var webView: WebView? by remember { mutableStateOf(null) }
        var canGoBack by remember { mutableStateOf(false) }

        // Intercept back presses to navigate backwards in WebView history
        BackHandler(enabled = canGoBack) {
          webView?.goBack()
        }

        // Extract window insets safely inside Compose
        val density = LocalDensity.current
        val safeDrawing = WindowInsets.safeDrawing.asPaddingValues()
        
        // These read from Compose state, so any changes to safe drawing insets will trigger recomposition
        val topPaddingDp = safeDrawing.calculateTopPadding().value
        val bottomPaddingDp = safeDrawing.calculateBottomPadding().value
        
        currentTopPadding = topPaddingDp
        varBottomPadding = bottomPaddingDp

        val applySafeAreas = { web: WebView?, top: Float, bottom: Float ->
          web?.post {
            web.evaluateJavascript("""
              (function() {
                var topVal = '${top}px';
                var botVal = '${bottom}px';
                document.documentElement.style.setProperty('--safe-area-top', topVal);
                document.documentElement.style.setProperty('--safe-area-bottom', botVal);
                console.log('[SafeAreas] Applied top: ' + topVal + ', bottom: ' + botVal);
              })();
            """.trimIndent(), null)
          }
        }

        AndroidView(
          modifier = Modifier.fillMaxSize(),
          factory = { context ->
            WebView(context).apply {
              settings.javaScriptEnabled = true
              settings.domStorageEnabled = true
              settings.allowFileAccess = true
              settings.allowContentAccess = true
              settings.databaseEnabled = true
              settings.allowFileAccessFromFileURLs = true
              settings.allowUniversalAccessFromFileURLs = true
              settings.setGeolocationEnabled(true) // Enable WebView geolocation settings
              
              webViewClient = object : WebViewClient() {
                override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                  super.onReceivedError(view, request, error)
                  android.util.Log.e("WebViewError", "Error loading: ${error?.description} (${error?.errorCode}) for URL: ${request?.url}")
                }

                override fun doUpdateVisitedHistory(view: WebView?, url: String?, isReload: Boolean) {
                  super.doUpdateVisitedHistory(view, url, isReload)
                  canGoBack = view?.canGoBack() == true
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                  super.onPageFinished(view, url)
                  applySafeAreas(view, currentTopPadding, varBottomPadding)
                }
              }

              webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                  android.util.Log.d("WebViewConsole", "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                  return true
                }

                // Grant geolocation request inside WebView
                override fun onGeolocationPermissionsShowPrompt(
                  origin: String?,
                  callback: GeolocationPermissions.Callback?
                ) {
                  callback?.invoke(origin, true, false)
                }
              }
              
              loadUrl("file:///android_asset/public/index.html")
              webView = this
            }
          },
          update = { view ->
            webView = view
            applySafeAreas(view, topPaddingDp, bottomPaddingDp)
          }
        )
      }
    }
  }
}
