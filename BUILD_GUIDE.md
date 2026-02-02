# Guide: Build Android App Locally

## Prerequisites Setup

### 1. Install Android Studio
- Download from: https://developer.android.com/studio
- Install with default settings including:
  - Android SDK
  - Android SDK Platform-Tools
  - Android Virtual Device (optional, for emulator)

### 2. Set Environment Variables (Windows)

Add these to your System Environment Variables:

```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
```

Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

To set them:
1. Search "Environment Variables" in Windows
2. Click "Environment Variables" button
3. Under "System variables", click "New"
4. Add ANDROID_HOME variable
5. Edit PATH and add the three paths above

### 3. Verify Installation

Open a NEW terminal (after setting env vars) and run:
```bash
adb --version
```

## Building the APK

### Option 1: Build with EAS Locally (Recommended)

```bash
# Install EAS CLI globally (if not already)
npm install -g eas-cli

# Login to Expo
eas login

# Build locally
eas build --platform android --local
```

This will:
- Build the APK on your machine (not in the cloud)
- Output an APK file you can install directly
- Take 10-20 minutes depending on your machine

### Option 2: Build with Expo Prebuild + Android Studio

```bash
# Generate native Android project
npx expo prebuild --platform android

# This creates an 'android' folder with native code
```

Then:
1. Open Android Studio
2. File → Open → Select the `android` folder
3. Wait for Gradle sync to complete
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. APK will be in: `android/app/build/outputs/apk/release/`

### Option 3: Build APK via Command Line

```bash
# After running 'npx expo prebuild'
cd android
./gradlew assembleRelease

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Installing the APK

### On Physical Device:
1. Enable "Developer Options" on your phone
2. Enable "USB Debugging"
3. Connect phone via USB
4. Run: `adb install path/to/your-app.apk`

### Or:
- Transfer APK to phone
- Open it and install (you may need to allow "Install from Unknown Sources")

## Testing During Development

For testing without building APK:
```bash
# Start Expo dev server
npx expo start

# Then press 'a' to open on Android emulator/device
```

## Notes

- **First build takes longest** (downloading dependencies)
- **Subsequent builds are faster** (cached)
- **Local builds** don't require EAS subscription
- **Cloud builds** (EAS) are easier but require internet

## Troubleshooting

### "ANDROID_HOME not set"
- Restart terminal after setting environment variables
- Verify with: `echo %ANDROID_HOME%`

### "SDK not found"
- Open Android Studio
- Tools → SDK Manager
- Install latest Android SDK

### Gradle errors
- Make sure Java JDK is installed
- Android Studio includes JDK, use that one
