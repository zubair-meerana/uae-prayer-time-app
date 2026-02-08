#!/bin/bash

# 1. Set the correct Java Home (Ensure this path exists on your system)
# If on macOS, use: export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export JAVA_HOME="/usr/lib/jvm/jdk-17.0.18+8"

# 2. Fix the Android SDK conflict
# We point both to the SAME directory to satisfy Gradle
export ANDROID_HOME="/usr/lib/android-sdk"
export ANDROID_SDK_ROOT="/usr/lib/android-sdk"

# 3. Update PATH so the build tools are visible
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# 4. (Optional) Increase Node memory for large builds
export NODE_OPTIONS="--max-old-space-size=8192"

echo "✅ Environment variables set."
echo "JDK Path: $JAVA_HOME"
echo "SDK Path: $ANDROID_HOME"

# 5. Clean and Build
echo "🚀 Starting local EAS build..."

# Using --local flag to run the build on your machine
# We use 'npx' to ensure we use the project's version of EAS
npx eas build --platform android --local --profile preview