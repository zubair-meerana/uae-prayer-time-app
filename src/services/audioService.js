import { Audio } from "expo-audio";

let soundObject = null;
let isPlaying = false;

/**
 * Configure audio mode for optimal alarm playback
 */
export const configureAudioMode = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // Play even when silent switch is on (iOS)
      staysActiveInBackground: true, // Continue playing when app is in background
      shouldDuckAndroid: false, // Don't reduce volume of other apps on Android
      playThroughEarpieceAndroid: false, // Play through speaker instead of earpiece
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    });
  } catch (error) {
    console.error("Error configuring audio mode:", error);
  }
};

/**
   * Load and play a sound file
   * @param {string} soundUri - URI of the sound file to play
   * @param {boolean} loop - Whether to loop the sound
   */
  export const playAlarmSound = async (soundUri = null, loop = true) => {
    try {
      if (isPlaying) {
        await stopAlarmSound();
      }

      // Configure audio mode for maximum effectiveness
      await configureAudioMode();

      // If no specific sound is provided, try to use a default alarm sound
      if (!soundUri) {
        // Try to use a built-in alarm sound first
        try {
          // For Android, we can try to use a notification sound
          if (Platform.OS === 'android') {
            // Try to play a system alarm sound
            try {
              await Audio.playSystemSoundAsync(Audio.SystemSoundID.Alarm);
              isPlaying = true;
              return null;
            } catch (alarmError) {
              // Fallback to vibration
              try {
                await Audio.playSystemSoundAsync(Audio.SystemSoundID.Vibrate);
                isPlaying = true;
                return null;
              } catch (vibrateError) {
                console.log(
                  "System alarm/vibration sounds not available, proceeding with notification-based alarm",
                );
              }
            }
          } else {
            // For iOS, try system sounds
            try {
              await Audio.playSystemSoundAsync(Audio.SystemSoundID.Vibrate);
              isPlaying = true;
              return null;
            } catch (iosSoundError) {
              console.log(
                "System sound not available, proceeding with notification-based alarm",
              );
            }
          }
        } catch (systemSoundError) {
          console.log(
            "System sound not available, proceeding with notification-based alarm",
          );
        }
      }

      // If a specific sound URI is provided, play it
      if (soundUri) {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: soundUri },
          {
            shouldPlay: true,
            isLooping: loop,
            volume: 1.0,
          },
          onPlaybackStatusUpdate,
        );

        soundObject = sound;
        isPlaying = true;

        // Increase volume to maximum
        await sound.setVolumeAsync(1.0);

        return sound;
      }

      // If we reach here, we're using a notification-based alarm
      isPlaying = true;
      return null;
    } catch (error) {
      console.error("Error playing alarm sound:", error);

      // Even if sound fails, mark as playing to prevent overlapping alarms
      isPlaying = true;
      return null;
    }
  };

/**
 * Stop the currently playing alarm sound
 */
export const stopAlarmSound = async () => {
  try {
    if (soundObject) {
      await soundObject.stopAsync();
      await soundObject.unloadAsync();
      soundObject = null;
    }
    isPlaying = false;
  } catch (error) {
    console.error("Error stopping alarm sound:", error);
  }
};

/**
 * Pause the currently playing alarm sound
 */
export const pauseAlarmSound = async () => {
  try {
    if (soundObject) {
      await soundObject.pauseAsync();
    }
  } catch (error) {
    console.error("Error pausing alarm sound:", error);
  }
};

/**
 * Resume the currently paused alarm sound
 */
export const resumeAlarmSound = async () => {
  try {
    if (soundObject) {
      await soundObject.playAsync();
    }
  } catch (error) {
    console.error("Error resuming alarm sound:", error);
  }
};

/**
 * Set the volume of the currently playing sound
 * @param {number} volume - Volume level between 0 and 1
 */
export const setAlarmVolume = async (volume) => {
  try {
    if (soundObject) {
      await soundObject.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }
  } catch (error) {
    console.error("Error setting alarm volume:", error);
  }
};

/**
 * Callback for playback status updates
 */
const onPlaybackStatusUpdate = (status) => {
  if (status.didJustFinish) {
    isPlaying = false;
  }
};

/**
 * Initialize the audio system
 */
export const initializeAudioSystem = async () => {
  try {
    // Configure audio mode for alarms
    await configureAudioMode();
  } catch (error) {
    console.error("Error initializing audio system:", error);
  }
};

/**
 * Check if alarm is currently playing
 */
export const isAlarmPlaying = () => {
  return isPlaying;
};
