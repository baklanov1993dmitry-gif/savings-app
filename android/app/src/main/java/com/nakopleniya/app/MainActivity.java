package com.nakopleniya.app;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.WindowManager;
import android.webkit.*;
import android.widget.Toast;
import java.io.OutputStream;

public class MainActivity extends Activity {
    static final String URL = "https://baklanov1993dmitry-gif.github.io/savings-app/";
    WebView web;
    ValueCallback<Uri[]> picker;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false); s.setAllowContentAccess(false); s.setMediaPlaybackRequiresUserGesture(false);
        CookieManager.getInstance().setAcceptCookie(true);
        web.addJavascriptInterface(new Object() {
            @JavascriptInterface public void save(String name, String text) { saveFile(name, text); }
        }, "SvAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u.getHost() != null && u.getHost().equals("baklanov1993dmitry-gif.github.io")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) {}
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (picker != null) picker.onReceiveValue(null);
                picker = cb;
                try { startActivityForResult(p.createIntent(), 7); } catch (Exception e) { picker = null; return false; }
                return true;
            }
        });
        if (b != null) web.restoreState(b); else web.loadUrl(URL);
    }

    void saveFile(String name, String text) {
        try {
            String safe = name.replaceAll("[^A-Za-z0-9._-]", "_");
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, safe); v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
            Uri u;
            if (Build.VERSION.SDK_INT >= 29) {
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            } else {
                java.io.File f = new java.io.File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), safe);
                u = Uri.fromFile(f);
            }
            OutputStream o = getContentResolver().openOutputStream(u);
            o.write(text.getBytes("UTF-8")); o.close();
            runOnUiThread(() -> Toast.makeText(this, "Сохранено в Загрузки: " + safe, Toast.LENGTH_LONG).show());
        } catch (Exception e) {
            runOnUiThread(() -> Toast.makeText(this, "Не удалось сохранить: " + e.getMessage(), Toast.LENGTH_LONG).show());
        }
    }

    @Override protected void onActivityResult(int req, int res, Intent d) {
        if (req == 7 && picker != null) { picker.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, d)); picker = null; }
        else super.onActivityResult(req, res, d);
    }
    @Override protected void onSaveInstanceState(Bundle b) { super.onSaveInstanceState(b); web.saveState(b); }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
