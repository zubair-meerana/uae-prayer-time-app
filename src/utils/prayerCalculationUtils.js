/**
 * Fallback prayer time calculation algorithm
 * Uses astronomical formulas to calculate prayer times based on coordinates and date
 */

/**
 * Convert degrees to radians
 */
const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 */
const radToDeg = (radians) => {
    return radians * (180 / Math.PI);
};

/**
 * Calculate Julian Day Number
 */
const julianDay = (year, month, day) => {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5;
};

/**
 * Calculate Equation of Time (in minutes)
 */
const equationOfTime = (julianDay) => {
    const T = (julianDay - 2451545.0) / 36525;
    const L0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
    const g = degToRad(357.52911 + T * (35999.05029 - T * 0.0001537));
    const c = T * T;
    const sinG = Math.sin(g);
    const sin2G = Math.sin(2 * g);
    const sin3G = Math.sin(3 * g);
    const cosG = Math.cos(g);
    const cos2G = Math.cos(2 * g);
    const cos3G = Math.cos(3 * g);

    const series1 = 1.914602 - T * (0.004817 + 0.000014 * c);
    const series2 = 0.019993 - T * 0.000101 * c;
    const series3 = 0.000289 * c;

    const sunLong = L0 + series1 * sinG + series2 * sin2G + series3 * sin3G;
    const omega = 125.04 - 1934.136 * T;
    const lambda = sunLong - 0.00569 - 0.00478 * Math.sin(degToRad(omega));

    const eot = 4 * radToDeg(
        2 * sinG * sin(degToRad(28.0 - (L0 - sunLong) / 30)) -
        2.0 * sin2G * sin(degToRad(lambda / 2)) +
        sin2G * sinG * cos(degToRad(lambda / 2)) * cos(degToRad(lambda / 2)) * 0.5 -
        sinG * sinG * sinG / 6 +
        sin2G * sin2G * sin(degToRad(lambda / 2)) * sin(degToRad(lambda / 2)) * 0.5
    );

    return eot;
};

/**
 * Calculate solar declination (in degrees)
 */
const solarDeclination = (julianDay) => {
    const T = (julianDay - 2451545.0) / 36525;
    const epsilon0 = 23 + (26 + 21.448 / 60) / 60;
    const epsilon = epsilon0 - T * (46.815 / 3600 - T * (0.00059 / 3600 - T * 0.001813 / 3600));
    const l0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
    const g = 357.52911 + T * (35999.05029 - T * 0.0001537);
    const sinL0 = Math.sin(degToRad(l0));
    const sin2g = Math.sin(degToRad(2 * g));
    const sin3g = Math.sin(degToRad(3 * g));
    const sin4g = Math.sin(degToRad(4 * g));
    const sin5g = Math.sin(degToRad(5 * g));

    const series1 = 0.002555 - T * (0.000005 + 0.000007 * T);
    const series2 = 0.001944 - T * (0.00002 * T);
    const series3 = 0.001242 - T * (0.000004 * T);
    const series4 = 0.000005 + T * (0.000049 * T);
    const series5 = 0.000005 - T * (0.000001 * T);

    const sinSigma =
        sinL0 * Math.sin(degToRad(epsilon)) +
        series1 * sin2g * Math.sin(degToRad(epsilon)) +
        series2 * sin3g * Math.sin(degToRad(epsilon)) +
        series3 * sin4g * Math.sin(degToRad(epsilon)) +
        series4 * sin5g * Math.sin(degToRad(epsilon)) +
        0.000005 * Math.sin(degToRad(5 * l0)) * Math.sin(degToRad(epsilon));

    return radToDeg(Math.asin(sinSigma));
};

/**
 * Calculate time for a specific prayer angle
 */
const calculateTime = (angle, latitude, longitude, timezone, julianDay) => {
    const declination = solarDeclination(julianDay);
    const numerator = -Math.sin(degToRad(angle)) - Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination));
    const denominator = Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination));
    const cosH = numerator / denominator;

    if (cosH < -1 || cosH > 1) {
        // Polar night or midnight sun - return null or handle specially
        return null;
    }

    const H = 12 + radToDeg(Math.acos(cosH)) / 15;
    const eot = equationOfTime(julianDay);

    return (H + timezone - longitude / 15 - eot / 60) % 24;
};

/**
 * Calculate prayer times for a given date and location
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {number} timezone - Timezone offset in hours
 * @param {Date} date - Date for which to calculate prayer times
 * @returns {Array} Array of prayer times in format {name: string, time: string}
 */
export const calculatePrayerTimes = (latitude, longitude, timezone, date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const jd = julianDay(year, month, day);

    // Standard prayer angles
    const fajrAngle = 18; // 18 degrees for Fajr
    const ishaAngle = 18;  // 18 degrees for Isha
    const asrAngle = 0;    // Calculated differently (shadows)

    // Calculate prayer times
    const fajrHour = calculateTime(fajrAngle, latitude, longitude, timezone, jd);
    const sunriseHour = calculateTime(-0.833, latitude, longitude, timezone, jd); // Sun appears on horizon
    const dhuhrHour = calculateTime(0, latitude, longitude, timezone, jd); // Solar noon
    const asrHour = calculateTime(48.5, latitude, longitude, timezone, jd); // Approximation for Asr
    const maghribHour = calculateTime(-0.833, latitude, longitude, timezone, jd); // Sunset
    const ishaHour = calculateTime(ishaAngle, latitude, longitude, timezone, jd);

    // Format times as HH:MM
    const formatTime = (hour) => {
        if (hour === null) return 'N/A';
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return [
        { name: 'Fajr', time: formatTime(fajrHour) },
        { name: 'Sunrise', time: formatTime(sunriseHour) },
        { name: 'Dhuhr', time: formatTime(dhuhrHour) },
        { name: 'Asr', time: formatTime(asrHour) },
        { name: 'Maghrib', time: formatTime(maghribHour) },
        { name: 'Isha', time: formatTime(ishaHour) }
    ];
};

/**
 * Calculate Asr time using the preferred method (Shafi'i, Maliki, Hanbali)
 * @param {number} latitude - Latitude in decimal degrees
 * @param {number} longitude - Longitude in decimal degrees
 * @param {number} timezone - Timezone offset in hours
 * @param {Date} date - Date for which to calculate prayer times
 * @returns {string} Asr time in HH:MM format
 */
export const calculateAsrTime = (latitude, longitude, timezone, date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const jd = julianDay(year, month, day);
    const declination = solarDeclination(jd);

    // For Asr calculation using the formula: cot(θ) = tan(|φ - δ|) + 1
    // Where φ is latitude and δ is declination
    const latRad = degToRad(latitude);
    const decRad = degToRad(declination);
    const absLatDecDiff = Math.abs(latRad - decRad);

    // Calculate the angle for Asr
    const asrAngle = radToDeg(Math.atan(1 / (Math.tan(absLatDecDiff) + 1)));

    const asrHour = calculateTime(asrAngle, latitude, longitude, timezone, jd);
    const formatTime = (hour) => {
        if (hour === null) return 'N/A';
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return formatTime(asrHour);
};
