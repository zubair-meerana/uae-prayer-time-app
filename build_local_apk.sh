#!/usr/bin/env bash
set -e

# 1. Set Android SDK root
export ANDROID_SDK_ROOT=/opt/android-sdk
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

# 2. Download command line tools only if not installed
if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
  TMP_ZIP="/tmp/cmdline-tools.zip"
  if [ ! -f "$TMP_ZIP" ]; then
    curl -L -o "$TMP_ZIP" "https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"
  fi

  # 3. Unzip and install
  unzip -q "$TMP_ZIP" -d /tmp/cmdline-tools
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  mv /tmp/cmdline-tools/cmdline-tools/* "$ANDROID_SDK_ROOT/cmdline-tools/latest/"
  rm -rf /tmp/cmdline-tools "$TMP_ZIP"
else
  echo "Android SDK cmdline-tools already installed, skipping download"
fi

# 4. Update PATH for SDK tools
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH"

# 5. Accept SDK licenses
yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses || true

# 6. Install required SDK packages
sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

# 7. Ensure Gradle can find SDK (create local.properties)
cat > android/local.properties <<EOF
sdk.dir=$ANDROID_SDK_ROOT
EOF

# 8. Set JAVA_HOME (using installed OpenJDK 21)
export JAVA_HOME=$(readlink -f /usr/lib/jvm/java-21-openjdk-amd64)
export PATH="$JAVA_HOME/bin:$PATH"
java -version

# 9. Install project dependencies (using yarn)
if command -v yarn >/dev/null 2>&1; then
  yarn install
else
  npm install
fi

# 10. Run expo prebuild for Android
npx expo prebuild --no-install --platform android

# 11. Build APK locally with EAS
eas build --profile preview --local --platform android
