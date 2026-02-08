#!/usr/bin/env bash
set -e

# --- 1. Environment Sync ---
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME=$(find /usr/lib/jvm -name "*java-17*" -type d -print -quit)
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin:$PATH"

echo "📍 Using JAVA_HOME: $JAVA_HOME"

# --- 2. Install Android Tooling ---
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
  echo "Downloading Command Line Tools..."
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  curl -L -o /tmp/tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"
  unzip -q /tmp/tools.zip -d /tmp/android-install
  mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
  mv /tmp/android-install/cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
  rm -rf /tmp/android-install /tmp/tools.zip
fi

# --- 3. Licenses & Packages ---
echo "Accepting licenses & installing SDK components..."
yes | sdkmanager --licenses > /dev/null
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;27.1.12297006"

# --- 4. Dependencies & Prebuild ---
npm install # or yarn install
mkdir -p android
echo "sdk.dir=$ANDROID_HOME" > android/local.properties

echo "🛠️ Running Expo Prebuild..."
npx expo prebuild --no-install --platform android