# Building the Android APK (local) in a bare Node.js (Alpine) container

This document summarizes all steps I performed to produce a working APK locally (Alpine Linux / minimal Node.js container).

> Quick summary: install Node/EAS, install Java 17, install Android SDK command-line tools + required packages, set environment variables, fix `app.json` (remove invalid notification sound), run `expo prebuild`, and run `eas build --profile preview --local --platform android`.

---

## 1. Base dev packages (Alpine)

Install system packages you'll need:

```sh
apk add --no-cache bash curl unzip git nodejs npm yarn openjdk17-jdk
```

Verify:

```sh
node -v && npm -v
java -version
```

Notes:
- Use `openjdk17` or `openjdk17-jdk` depending on the Alpine repository. Ensure Java 17 is installed.

---

## 2. EAS CLI and Expo tooling

Install EAS CLI (or use `npx` when you don't want a global install):

```sh
npm install -g eas-cli
# or use: npx eas-cli <command>
```

If you use remote builds or need credentials:

```shne
eas login
```

---

## 3. Android SDK (cmdline tools) — install and packages

Choose a SDK root (example uses `/opt/android-sdk`):

```sh
export ANDROID_SDK_ROOT=/opt/android-sdk
mkdir -p $ANDROID_SDK_ROOT/cmdline-tools
curl -L -o /tmp/cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip"
unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools
mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest
mv /tmp/cmdline-tools/cmdline-tools/* $ANDROID_SDK_ROOT/cmdline-tools/latest/
rm -rf /tmp/cmdline-tools /tmp/cmdline-tools.zip
```

Add to PATH / export env:

```sh
export ANDROID_HOME=$ANDROID_SDK_ROOT
export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT
export PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH
```

Install required SDK packages (example versions matched to the project we built):

```sh
sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"
# Accept licenses
yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses
```

Notes:
- `sdkmanager` downloads large artifacts — ensure sufficient disk and bandwidth.
- On Alpine you may have to install `unzip`, `curl`, etc. as shown above.

---

## 4. Make SDK discoverable by Gradle

Either put `sdk.dir` in `android/local.properties` or export `ANDROID_HOME` / `ANDROID_SDK_ROOT` in the same environment where you run `eas build`.

Create `android/local.properties` (project root):

```
sdk.dir=/opt/android-sdk
```

Or ensure:

```sh
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH
```

---

## 5. Ensure JAVA_HOME is set to Java 17

```sh
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk  # or the actual JDK path
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

---

## 6. Project prep and fixes

- Install node dependencies and create lockfile (reduces `expo doctor` issues):

```sh
# prefer yarn (creates yarn.lock)
yarn install
```

- Fix `app.json` if you use `expo-notifications`. Do not set a sound named `"default"` because Android resource names must be lowercase and not Java reserved words. Example change:

```diff
- "sounds": ["default"]
+ /* remove or use a valid custom sound resource like "custom_sound" and place it in assets/sounds */
```

- Run prebuild to ensure native assets are generated:

```sh
npx expo prebuild --no-install --platform android
```

---

## 7. Local build (EAS)

Ensure env variables are set in the same shell and run:

```sh
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH

eas build --profile preview --local --platform android
```

On success the APK will be written to the repository root, e.g. `./build-<timestamp>.apk`.

---

## 8. Install / test the APK (optional)

If you have `adb` and a device or emulator attached:

```sh
adb install -r build-*.apk
```

---

## 9. Quick Dockerfile (Alpine) example

This is a minimal example to illustrate the steps — you will need to tune it for CI (caching, user permissions, disk size, noninteractive license acceptance etc.).

```dockerfile
FROM node:20-alpine

# install OS tools
RUN apk add --no-cache bash curl unzip git openjdk17-jdk python3 make

ENV ANDROID_SDK_ROOT=/opt/android-sdk
RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools

# download commandline tools (update URL if necessary)
RUN curl -L -o /tmp/cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip" \
  && unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools \
  && mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest \
  && mv /tmp/cmdline-tools/cmdline-tools/* $ANDROID_SDK_ROOT/cmdline-tools/latest/ \
  && rm -rf /tmp/cmdline-tools /tmp/cmdline-tools.zip

ENV PATH=$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$PATH

# install required sdk packages (non-interactive acceptance may vary)
RUN yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006" \
  && yes | sdkmanager --sdk_root=$ANDROID_SDK_ROOT --licenses

WORKDIR /app
COPY . /app
RUN yarn install

# optional: run prebuild and local build (these steps require adequate resources and may be better run in CI runner)
# RUN npx expo prebuild --no-install --platform android
# RUN eas build --profile preview --local --platform android

CMD ["/bin/bash"]
```

> CAUTION: Building inside a Docker container requires a lot of disk space and careful handling of licenses and permissions. Some CI providers offer dedicated Android build images that are preferable.

---

## Notes & gotchas
- Downloads are large (SDK, NDK, build-tools) — ensure enough disk space. 📦
- `expo doctor` warns about missing lockfile — generate `yarn.lock` or `package-lock.json` to pass that check. ✅
- If you prefer not to host SDK locally, use EAS remote cloud builds: `eas build --profile preview --platform android`.

---

If you'd like, I can:
- generate a ready-to-run Alpine-based Dockerfile tuned for CI, or
- create a small script that automates these steps in your container.

Which should I create next? 🚀
