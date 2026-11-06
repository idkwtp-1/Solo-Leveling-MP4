package com.shadowplayer.app;

import android.content.Context;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ShadowAudio")
public class ShadowAudioPlugin extends Plugin {
    private static ShadowAudioPlugin instance;

    @Override
    public void load() {
        super.load();
        instance = this;
    }

    public static void notifyAction(String action) {
        if (instance != null) {
            JSObject ret = new JSObject();
            ret.put("action", action);
            instance.notifyListeners("nativeMediaControl", ret);
        }
    }

    @PluginMethod
    public void updatePlayback(PluginCall call) {
        String title = call.getString("title", "Shadow Player");
        String artist = call.getString("artist", "Solo Leveling");
        Boolean isPlaying = call.getBoolean("isPlaying", true);

        Context context = getContext();
        Intent intent = new Intent(context, ShadowAudioService.class);
        intent.setAction(ShadowAudioService.ACTION_UPDATE);
        intent.putExtra(ShadowAudioService.EXTRA_TITLE, title);
        intent.putExtra(ShadowAudioService.EXTRA_ARTIST, artist);
        intent.putExtra(ShadowAudioService.EXTRA_PLAYING, isPlaying != null ? isPlaying : true);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }

        call.resolve();
    }

    @PluginMethod
    public void stopPlayback(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, ShadowAudioService.class);
        intent.setAction(ShadowAudioService.ACTION_STOP);
        context.startService(intent);
        call.resolve();
    }
}
