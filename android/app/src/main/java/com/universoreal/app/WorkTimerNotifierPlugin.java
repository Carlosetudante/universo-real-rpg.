package com.universoreal.app;

import android.Manifest;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "WorkTimerNotifier",
        permissions = {
                @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
        }
)
public class WorkTimerNotifierPlugin extends Plugin {
    private static final int NOTIFICATION_ID = WorkTimerForegroundService.NOTIFICATION_ID;

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        if (getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = getPermissionState("notifications") == PermissionState.GRANTED;
        result.put("granted", granted);
        if (granted) {
            call.resolve(result);
        } else {
            call.reject("Permissão de notificação negada.");
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        long startTime = call.getLong("startTime", System.currentTimeMillis());
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Permissão de notificação não concedida.");
            return;
        }
        try {
            Intent intent = new Intent(getContext(), WorkTimerForegroundService.class)
                    .setAction(WorkTimerForegroundService.ACTION_START)
                    .putExtra(WorkTimerForegroundService.EXTRA_START_TIME, startTime);

            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Falha ao iniciar notificaÃ§Ã£o em foreground", e);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            Intent stopIntent = new Intent(getContext(), WorkTimerForegroundService.class)
                    .setAction(WorkTimerForegroundService.ACTION_STOP);
            getContext().startService(stopIntent);
            NotificationManagerCompat.from(getContext()).cancel(NOTIFICATION_ID);
            call.resolve();
        } catch (Exception e) {
            call.reject("Falha ao parar notificaÃ§Ã£o em foreground", e);
        }
    }
}

