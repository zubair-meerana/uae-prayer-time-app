#!/usr/bin/env bash
set -e

# 1. Set Android SDK root
export ANDROID_SDK_ROOT=/opt/android-sdk
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

# 2. Download command line tools only if not installed
if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
  TMP_ZIP="/tmp/cmdline-tools.zip"
  echo "Downloading Android Command Line Tools..."
  curl -L -o "$TMP_ZIP" "https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"

  # 3. Unzip and install
  # We unzip to a temp folder first to handle the 'cmdline-tools' subfolder inside the zip
  mkdir -p /tmp/android-install
  unzip -q "$TMP_ZIP" -d /tmp/android-install
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  mv /tmp/android-install/cmdline-tools/* "$ANDROID_SDK_ROOT/cmdline-tools/latest/"
  rm -rf /tmp/android-install "$TMP_ZIP"
else
  echo "Android SDK cmdline-tools already installed, skipping download"
fi

# 4. Update PATH
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# 5. Accept SDK licenses
yes | sdkmanager --licenses || true

# 6. Install required SDK packages
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

# 7. Ensure local.properties exists
mkdir -p android
echo "sdk.dir=$ANDROID_SDK_ROOT" > android/local.properties

# 8. Set JAVA_HOME
# Note: Ensure this path is correct for your specific Docker image/OS
export JAVA_HOME=$(readlink -f /usr/lib/jvm/jdk-17.0.18+8)
export PATH="$JAVA_HOME/bin:$PATH"

# 9. Dependencies
if [ -f "yarn.lock" ]; then
  yarn install
else
  npm install
fi

# 10. Prebuild and Build
npx expo prebuild --no-install --platform android
eas build --profile preview --local --platform android