package com.shadowplayer.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.view.KeyEvent;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.media.session.MediaButtonReceiver;

public class ShadowAudioService extends Service {
    public static final String CHANNEL_ID = "shadow_player_playback_channel";
    public static final int NOTIFICATION_ID = 9001;

    public static final String ACTION_START = "com.shadowplayer.app.ACTION_START";
    public static final String ACTION_UPDATE = "com.shadowplayer.app.ACTION_UPDATE";
    public static final String ACTION_STOP = "com.shadowplayer.app.ACTION_STOP";

    public static final String ACTION_PLAY_PAUSE = "com.shadowplayer.app.ACTION_PLAY_PAUSE";
    public static final String ACTION_NEXT = "com.shadowplayer.app.ACTION_NEXT";
    public static final String ACTION_PREV = "com.shadowplayer.app.ACTION_PREV";

    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_PLAYING = "extra_playing";
    public static final String EXTRA_POSITION = "extra_position";
    public static final String EXTRA_DURATION = "extra_duration";

    private PowerManager.WakeLock wakeLock;
    private MediaSessionCompat mediaSession;
    private AudioManager audioManager;
    private String currentTitle = "Shadow Player // System Online";
    private String currentArtist = "Solo Leveling";
    private boolean isPlaying = false;
    private long currentPosition = PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN;
    private long currentDuration = 0L;
    private boolean isNoisyReceiverRegistered = false;

    private final BroadcastReceiver becomingNoisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                ShadowAudioPlugin.notifyAction("pause");
            }
        }
    };

    private void registerNoisyReceiver() {
        if (!isNoisyReceiverRegistered) {
            try {
                registerReceiver(becomingNoisyReceiver, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY));
                isNoisyReceiverRegistered = true;
            } catch (Exception ignored) {}
        }
    }

    private void unregisterNoisyReceiver() {
        if (isNoisyReceiverRegistered) {
            try {
                unregisterReceiver(becomingNoisyReceiver);
            } catch (Exception ignored) {}
            isNoisyReceiverRegistered = false;
        }
    }

    private static final long MEDIA_ACTIONS = PlaybackStateCompat.ACTION_PLAY
        | PlaybackStateCompat.ACTION_PAUSE
        | PlaybackStateCompat.ACTION_PLAY_PAUSE
        | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
        | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
        | PlaybackStateCompat.ACTION_STOP
        | PlaybackStateCompat.ACTION_SEEK_TO
        | PlaybackStateCompat.ACTION_FAST_FORWARD
        | PlaybackStateCompat.ACTION_REWIND;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        mediaSession = new MediaSessionCompat(this, "ShadowPlayerMediaSession");
        mediaSession.setFlags(
            MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
            MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
        );

        Intent mediaButtonIntent = new Intent(Intent.ACTION_MEDIA_BUTTON, null, this, MediaButtonReceiver.class);
        PendingIntent mbrPendingIntent = PendingIntent.getBroadcast(
            this,
            0,
            mediaButtonIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );
        mediaSession.setMediaButtonReceiver(mbrPendingIntent);

        mediaSession.setCallback(new MediaSessionCompat.Callback() {
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
            public void onPlay() {
                ShadowAudioPlugin.notifyAction("play");
            }

            @Override
            public void onPause() {
                ShadowAudioPlugin.notifyAction("pause");
            }

            @Override
            public void onSkipToNext() {
                ShadowAudioPlugin.notifyAction("next");
            }

            @Override
            public void onSkipToPrevious() {
                ShadowAudioPlugin.notifyAction("prev");
            }

            @Override
            public void onFastForward() {
                ShadowAudioPlugin.notifyAction("next");
            }

            @Override
            public void onRewind() {
                ShadowAudioPlugin.notifyAction("prev");
            }

            @Override
            public void onSeekTo(long pos) {
                currentPosition = pos;
                updatePlaybackState();
                ShadowAudioPlugin.notifySeek(pos);
            }

            @Override
            public void onStop() {
                ShadowAudioPlugin.notifyAction("pause");
            }

            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonIntent) {
                if (mediaButtonIntent != null && Intent.ACTION_MEDIA_BUTTON.equals(mediaButtonIntent.getAction())) {
                    KeyEvent event = mediaButtonIntent.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
                    if (event != null) {
                        int keyCode = event.getKeyCode();
                        if (event.getAction() == KeyEvent.ACTION_DOWN) {
                            if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                                onSkipToNext();
                                return true;
                            } else if (keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                                onSkipToPrevious();
                                return true;
                            } else if (keyCode == KeyEvent.KEYCODE_HEADSETHOOK || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) {
                                hookClickCount++;
                                hookHandler.removeCallbacks(hookRunnable);
                                hookHandler.postDelayed(hookRunnable, 300);
                                return true;
                            }
                        } else if (event.getAction() == KeyEvent.ACTION_UP) {
                            if (keyCode == KeyEvent.KEYCODE_MEDIA_NEXT ||
                                keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS ||
                                keyCode == KeyEvent.KEYCODE_HEADSETHOOK ||
                                keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE) {
                                return true;
                            }
                        }
                    }
                }
                return super.onMediaButtonEvent(mediaButtonIntent);
            }
        });

        updatePlaybackState();
        updateMediaMetadata();
        mediaSession.setActive(true);

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "ShadowPlayer::AudioWakeLock");
            wakeLock.setReferenceCounted(false);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();

            if (Intent.ACTION_MEDIA_BUTTON.equals(action)) {
                MediaButtonReceiver.handleIntent(mediaSession, intent);
                return START_STICKY;
            }

            if (ACTION_START.equals(action) || ACTION_UPDATE.equals(action)) {
                if (intent.hasExtra(EXTRA_TITLE)) {
                    currentTitle = intent.getStringExtra(EXTRA_TITLE);
                }
                if (intent.hasExtra(EXTRA_ARTIST)) {
                    currentArtist = intent.getStringExtra(EXTRA_ARTIST);
                }
                if (intent.hasExtra(EXTRA_PLAYING)) {
                    isPlaying = intent.getBooleanExtra(EXTRA_PLAYING, true);
                }
                if (intent.hasExtra(EXTRA_POSITION)) {
                    currentPosition = intent.getLongExtra(EXTRA_POSITION, PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN);
                }
                if (intent.hasExtra(EXTRA_DURATION)) {
                    currentDuration = intent.getLongExtra(EXTRA_DURATION, 0L);
                }

                if (wakeLock != null && isPlaying && !wakeLock.isHeld()) {
                    wakeLock.acquire(12 * 60 * 60 * 1000L); // Max 12 hours safety
                } else if (wakeLock != null && !isPlaying && wakeLock.isHeld()) {
                    wakeLock.release();
                }

                if (isPlaying) {
                    registerNoisyReceiver();
                } else {
                    unregisterNoisyReceiver();
                }
                updatePlaybackState();
                updateMediaMetadata();

                startForegroundServiceWithNotification();
            } else if (ACTION_STOP.equals(action)) {
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                }
                unregisterNoisyReceiver();
                updatePlaybackState();
                stopForeground(true);
                stopSelf();
            } else if (ACTION_PLAY_PAUSE.equals(action)) {
                ShadowAudioPlugin.notifyAction("toggle_play");
            } else if (ACTION_NEXT.equals(action)) {
                ShadowAudioPlugin.notifyAction("next");
            } else if (ACTION_PREV.equals(action)) {
                ShadowAudioPlugin.notifyAction("prev");
            }
        }

        return START_STICKY;
    }

    private void updatePlaybackState() {
        if (mediaSession == null) return;
        long pos = currentPosition;
        if (pos < 0) {
            pos = PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN;
        }
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
            .setActions(MEDIA_ACTIONS)
            .setState(
                isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                pos,
                isPlaying ? 1.0f : 0.0f
            );
        mediaSession.setPlaybackState(stateBuilder.build());
    }

    private void updateMediaMetadata() {
        if (mediaSession == null) return;
        MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
            .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
            .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Shadow Player");
        if (currentDuration > 0) {
            metadataBuilder.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDuration);
        }
        mediaSession.setMetadata(metadataBuilder.build());
    }



    private void startForegroundServiceWithNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent prevIntent = new Intent(this, ShadowAudioService.class).setAction(ACTION_PREV);
        PendingIntent prevPendingIntent = PendingIntent.getService(
            this,
            1,
            prevIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent playPauseIntent = new Intent(this, ShadowAudioService.class).setAction(ACTION_PLAY_PAUSE);
        PendingIntent playPausePendingIntent = PendingIntent.getService(
            this,
            2,
            playPauseIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Intent nextIntent = new Intent(this, ShadowAudioService.class).setAction(ACTION_NEXT);
        PendingIntent nextPendingIntent = PendingIntent.getService(
            this,
            3,
            nextIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(currentTitle)
            .setContentText(currentArtist)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(contentPendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(isPlaying)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent)
            .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", playPausePendingIntent)
            .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2));

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Shadow Player Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active playback controls on lock screen and notification bar");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        unregisterNoisyReceiver();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
