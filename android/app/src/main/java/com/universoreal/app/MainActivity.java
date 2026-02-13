package com.universoreal.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;

import com.getcapacitor.BridgeActivity;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import java.util.concurrent.Executor;

public class MainActivity extends BridgeActivity {
    private static final long BIOMETRIC_REAUTH_DELAY_MS = 25_000L;

    private boolean isAuthenticated = false;
    private boolean promptInProgress = false;
    private long lastBackgroundAtMs = 0L;
    private ActivityResultLauncher<String> notificationPermissionLauncher;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(WorkTimerNotifierPlugin.class);
        registerPlugin(VoiceRecognitionPlugin.class);
        setupNotificationPermissionRequest();
        requestNotificationPermissionIfNeeded();
        enableImmersiveMode();
        promptBiometricIfNeeded();
    }

    @Override
    public void onResume() {
        super.onResume();
        enableImmersiveMode();
        if (shouldRequireBiometricNow()) {
            isAuthenticated = false;
        }
        promptBiometricIfNeeded();
    }

    @Override
    public void onStop() {
        super.onStop();
        // Track when app goes to background to enforce reauth after timeout.
        if (!isChangingConfigurations()) {
            promptInProgress = false;
            lastBackgroundAtMs = System.currentTimeMillis();
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enableImmersiveMode();
        }
    }

    private void setupNotificationPermissionRequest() {
        notificationPermissionLauncher = registerForActivityResult(
                new ActivityResultContracts.RequestPermission(),
                granted -> {
                }
        );
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) {
            return;
        }
        if (notificationPermissionLauncher != null) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
        }
    }

    private void promptBiometricIfNeeded() {
        if (isAuthenticated || promptInProgress) return;

        BiometricManager biometricManager = BiometricManager.from(this);
        int canAuthenticate = biometricManager.canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG
                        | BiometricManager.Authenticators.DEVICE_CREDENTIAL
        );

        if (canAuthenticate != BiometricManager.BIOMETRIC_SUCCESS) {
            isAuthenticated = true;
            return;
        }

        promptInProgress = true;
        Executor executor = ContextCompat.getMainExecutor(this);
        BiometricPrompt biometricPrompt = new BiometricPrompt(this, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                promptInProgress = false;
                isAuthenticated = true;
                lastBackgroundAtMs = 0L;
                enableImmersiveMode();
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                promptInProgress = false;
                // Keep app open, but do not keep auth as valid after cancel/error.
                isAuthenticated = false;
                enableImmersiveMode();
            }
        });

        BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Desbloquear Universo Real")
                .setSubtitle("Use biometria para acessar o app");

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            builder.setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG
                            | BiometricManager.Authenticators.DEVICE_CREDENTIAL
            );
        } else {
            builder.setDeviceCredentialAllowed(true);
        }

        biometricPrompt.authenticate(builder.build());
    }

    private boolean shouldRequireBiometricNow() {
        if (!isAuthenticated) return true;
        if (lastBackgroundAtMs <= 0L) return false;
        long elapsed = System.currentTimeMillis() - lastBackgroundAtMs;
        return elapsed >= BIOMETRIC_REAUTH_DELAY_MS;
    }

    private void enableImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WindowInsetsControllerCompat controller =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());

        if (controller != null) {
            controller.hide(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.navigationBars());
            controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }

        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
    }
}

