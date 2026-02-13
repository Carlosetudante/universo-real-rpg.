package com.universoreal.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.Locale;

public class WorkTimerForegroundService extends Service {
    public static final String ACTION_START = "com.universoreal.app.action.WORK_TIMER_START";
    public static final String ACTION_STOP = "com.universoreal.app.action.WORK_TIMER_STOP";
    public static final String EXTRA_START_TIME = "startTime";
    public static final String CHANNEL_ID = "work_timer_channel_v2";
    public static final int NOTIFICATION_ID = 41021;

    private final Handler tickerHandler = new Handler(Looper.getMainLooper());
    private long startTimeMs = 0L;

    private final Runnable ticker = new Runnable() {
        @Override
        public void run() {
            if (startTimeMs <= 0L) return;
            Notification updated = buildNotification(startTimeMs);
            NotificationManagerCompat.from(WorkTimerForegroundService.this)
                    .notify(NOTIFICATION_ID, updated);
            tickerHandler.postDelayed(this, 1000L);
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP.equals(action)) {
            stopTicker();
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        long startTime = System.currentTimeMillis();
        if (intent != null) {
            startTime = intent.getLongExtra(EXTRA_START_TIME, startTime);
        }
        startTimeMs = startTime;

        Notification notification = buildNotification(startTimeMs);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
        startTicker();
        return START_STICKY;
    }

    private Notification buildNotification(long startTime) {
        ensureChannel();

        int iconRes = getApplicationInfo().icon;
        Intent openAppIntent = new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                openAppIntent,
                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        Intent stopTimerIntent = new Intent(this, WorkTimerForegroundService.class)
                .setAction(ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this,
                1,
                stopTimerIntent,
                (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
                        ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                        : PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(iconRes)
                .setContentTitle("Tempo de Trabalho")
                .setContentText("Cronometro: " + formatElapsed(startTime))
                .setContentIntent(contentIntent)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setWhen(startTime)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(false)
                .addAction(iconRes, "Parar", stopPendingIntent)
                .build();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager == null) return;

        NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
        if (existing != null) return;

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Cronometro de trabalho",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Mostra o tempo correndo enquanto o app fica em segundo plano.");
        manager.createNotificationChannel(channel);
    }

    private String formatElapsed(long startTime) {
        long elapsedMs = Math.max(0L, System.currentTimeMillis() - startTime);
        long totalSeconds = elapsedMs / 1000L;
        long hours = totalSeconds / 3600L;
        long minutes = (totalSeconds % 3600L) / 60L;
        long seconds = totalSeconds % 60L;
        return String.format(Locale.US, "%02d:%02d:%02d", hours, minutes, seconds);
    }

    private void startTicker() {
        stopTicker();
        tickerHandler.postDelayed(ticker, 1000L);
    }

    private void stopTicker() {
        tickerHandler.removeCallbacks(ticker);
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopTicker();
        super.onDestroy();
    }
}
