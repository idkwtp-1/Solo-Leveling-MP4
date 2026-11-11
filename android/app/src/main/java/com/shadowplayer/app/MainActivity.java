package com.shadowplayer.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final Handler hookHandler = new Handler(Looper.getMainLooper());
    private int hookClickCount = 0;
    private final Runnable hookRunnable = new Runnable() {
        @Override
        public void run() {
            if (hookClickCount == 1) {
                ShadowAudioPlugin.notifyAction("toggle_play");
            } else if (hookClickCount == 2) {
                ShadowAudioPlugin.notifyAction("next");
            } else if (hookClickCount >= 3) {
                ShadowAudioPlugin.notifyAction("prev");
            }
            hookClickCount = 0;
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShadowAudioPlugin.class);
        super.onCreate(savedInstanceState);
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }

    @Override
    public void onDestroy() {
        hookHandler.removeCallbacks(hookRunnable);
        super.onDestroy();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PLAY ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE ||
            keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE ||
            keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {

            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                    ShadowAudioPlugin.notifyAction("next");
                } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                    ShadowAudioPlugin.notifyAction("prev");
                } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY) {
                    ShadowAudioPlugin.notifyAction("play");
                } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                    ShadowAudioPlugin.notifyAction("pause");
                } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_HEADSETHOOK) {
                    hookClickCount++;
                    hookHandler.removeCallbacks(hookRunnable);
                    hookHandler.postDelayed(hookRunnable, 300);
                }
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
}
