import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import * as Location from "expo-location";
import * as Sensor from "expo-sensors";

const { width } = Dimensions.get("window");

const QiblaCompass = () => {
  const { t, isRTL } = useLanguage();
  const [qiblaDirection, setQiblaDirection] = useState(0); // Qibla direction in degrees from true north
  const [currentHeading, setCurrentHeading] = useState(0); // Current device heading
  const [qiblaAngle, setQiblaAngle] = useState(new Animated.Value(0)); // For compass rotation
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [compassSupported, setCompassSupported] = useState(true);

  // Kaaba coordinates in Mecca
  const KAABA_LATITUDE = 21.4225;
  const KAABA_LONGITUDE = 39.8262;

  // Calculate Qibla direction based on user's location
  const calculateQiblaDirection = (userLat, userLng) => {
    // Convert degrees to radians
    const phi1 = (userLat * Math.PI) / 180;
    const phi2 = (KAABA_LATITUDE * Math.PI) / 180;
    const deltaLambda = ((KAABA_LONGITUDE - userLng) * Math.PI) / 180;

    // Calculate Qibla direction using spherical trigonometry
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    let qiblaRad = Math.atan2(y, x);
    let qiblaDeg = ((qiblaRad * 180) / Math.PI + 360) % 360;

    return qiblaDeg;
  };

  // Request location permission and get user's location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg(t("locationPermissionDenied"));
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);

        // Calculate Qibla direction
        const qiblaDir = calculateQiblaDirection(
          location.coords.latitude,
          location.coords.longitude,
        );
        setQiblaDirection(qiblaDir);
      } catch (error) {
        setErrorMsg(`${t("locationError")}: ${error.message}`);
      }
    })();
  }, []);

  // Subscribe to compass updates
  useEffect(() => {
    let subscription;

    // Check if magnetometer is available
    if (Sensor.Magnetometer) {
      Sensor.Magnetometer.setUpdateInterval(100); // Update every 100ms

      subscription = Sensor.Magnetometer.addListener((headingData) => {
        // Get magnetic heading
        let magneticHeading =
          (Math.atan2(-headingData.y, headingData.x) * 180) / Math.PI;
        magneticHeading = (magneticHeading + 360) % 360;

        // For simplicity, we'll use magnetic heading as current heading
        // In a production app, you'd want to account for magnetic declination
        setCurrentHeading(magneticHeading);

        // Calculate the rotation for the compass needle
        const rotation = qiblaDirection - magneticHeading;
        Animated.timing(qiblaAngle, {
          toValue: rotation,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setCompassSupported(false);
      setErrorMsg(t("compassNotSupported"));
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [qiblaDirection]);

  // Format degrees to a readable direction
  const getDirectionName = (degrees) => {
    const directions = [
      t("north"),
      t("northEast"),
      t("east"),
      t("southEast"),
      t("south"),
      t("southWest"),
      t("west"),
      t("northWest"),
    ];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  if (errorMsg) {
    return (
      <View style={[styles.container, isRTL && styles.rtlContainer]}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        {!compassSupported && (
          <Text style={styles.instructionText}>
            {t("compassNotSupportedInstruction")}
          </Text>
        )}
      </View>
    );
  }

  if (!userLocation) {
    return (
      <View style={[styles.container, isRTL && styles.rtlContainer]}>
        <Text style={styles.loadingText}>{t("locating")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Text style={styles.title}>{t("qiblaDirection")}</Text>

      <View style={styles.compassContainer}>
        {/* Compass circle */}
        <View style={styles.compassCircle}>
          {/* Cardinal directions */}
          <Text style={[styles.directionText, styles.northText]}>N</Text>
          <Text style={[styles.directionText, styles.eastText]}>E</Text>
          <Text style={[styles.directionText, styles.southText]}>S</Text>
          <Text style={[styles.directionText, styles.westText]}>W</Text>

          {/* Compass needle pointing to Qibla */}
          <Animated.View
            style={[
              styles.qiblaNeedle,
              {
                transform: [
                  {
                    rotate: `${qiblaAngle
                      .interpolate({
                        inputRange: [-180, 180],
                        outputRange: ["-180deg", "180deg"],
                      })
                      .__getValue()}deg`,
                  },
                ],
              },
            ]}
          >
            <View style={styles.qiblaArrow} />
            <Text style={styles.qiblaText}>{t("qibla")}</Text>
          </Animated.View>

          {/* Center point */}
          <View style={styles.centerPoint} />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {t("qiblaDirectionIs")} {Math.round(qiblaDirection)}° {t("fromNorth")}
        </Text>
        <Text style={styles.infoText}>
          {t("currentHeading")} {Math.round(currentHeading)}°{" "}
          {getDirectionName(currentHeading)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  rtlContainer: {
    // Any RTL specific styling
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#00897B",
    textAlign: "center",
    marginBottom: 16,
  },
  compassContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  compassCircle: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    borderWidth: 2,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    position: "relative",
  },
  directionText: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  northText: {
    top: 10,
    left: "45%",
  },
  eastText: {
    right: 10,
    top: "45%",
  },
  southText: {
    bottom: 10,
    left: "45%",
  },
  westText: {
    left: 10,
    top: "45%",
  },
  qiblaNeedle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  qiblaArrow: {
    width: 4,
    height: width * 0.25,
    backgroundColor: "#FF5722",
    position: "absolute",
    bottom: "50%",
    top: 10,
    transformOrigin: "bottom center",
  },
  qiblaText: {
    position: "absolute",
    top: -20,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF5722",
  },
  centerPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#333",
    position: "absolute",
    zIndex: 1,
  },
  infoContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
});

export default QiblaCompass;
