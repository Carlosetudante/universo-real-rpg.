package com.universoreal.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.speech.RecognizerIntent;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
        name = "VoiceRecognition",
        permissions = {
                @Permission(alias = "audio", strings = { Manifest.permission.RECORD_AUDIO })
        }
)
public class VoiceRecognitionPlugin extends Plugin {

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("audio") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("audio", call, "audioPermissionCallback");
    }

    @PermissionCallback
    private void audioPermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = getPermissionState("audio") == PermissionState.GRANTED;
        result.put("granted", granted);
        if (granted) {
            call.resolve(result);
        } else {
            call.reject("Microphone permission denied.");
        }
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (getPermissionState("audio") != PermissionState.GRANTED) {
            call.reject("Microphone permission not granted.");
            return;
        }

        String lang = call.getString("lang", "pt-BR");
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Fale agora");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);

        try {
            PackageManager pm = getContext() != null ? getContext().getPackageManager() : null;
            if (pm == null || intent.resolveActivity(pm) == null) {
                call.reject("No speech recognition service available on this device.");
                return;
            }
        } catch (Exception ex) {
            call.reject("Failed to validate speech recognition service.", ex);
            return;
        }

        try {
            startActivityForResult(call, intent, "voiceResultCallback");
        } catch (Exception ex) {
            call.reject("Could not start speech recognition.", ex);
        }
    }

    @ActivityCallback
    private void voiceResultCallback(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result == null) {
            JSObject payload = new JSObject();
            payload.put("transcript", "");
            payload.put("matches", new JSArray());
            payload.put("status", "no_result");
            call.resolve(payload);
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            JSObject payload = new JSObject();
            payload.put("transcript", "");
            payload.put("matches", new JSArray());
            payload.put("status", "cancelled");
            call.resolve(payload);
            return;
        }

        ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        JSArray jsMatches = new JSArray();
        if (matches != null) {
            for (String item : matches) {
                jsMatches.put(item);
            }
        }

        String transcript = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
        JSObject payload = new JSObject();
        payload.put("transcript", transcript);
        payload.put("matches", jsMatches);
        payload.put("lang", Locale.getDefault().toLanguageTag());
        payload.put("status", "ok");
        call.resolve(payload);
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        // RecognizerIntent closes itself after finish/cancel.
        call.resolve();
    }
}
