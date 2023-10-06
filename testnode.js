// This module to act as server, manage needed updates from client, provide data in JSON format from some local storage,
// call to the web and update local storage when needed
// create skeleton ui for manual manipulation if needed

var http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
      Vary: "Origin",
    });

    const urlParseResult = urlParse(req.url);
    getAltitudeAzimuthCurve();

    res.end(
      JSON.stringify({
        urlParseResult,
      })
    );
  })
  .listen(8080);

function urlParse(requestUrl) {
  if (requestUrl === "/test") {
    return "yes";
  } else {
    return "no";
  }
}

const degreesToRadians = Math.PI / 180;
const radiansToDegrees = 180 / Math.PI;
const rightAscension = rightAscensionToDecimalDegrees(2, 59);
const declination = declinationToDecimalDeclination(89, 21);
// call the usno api and return a list of 60 alt/az values with timestamps,
// separate by 1 minute for now, so 1 hours worth for a selected object
function getAltitudeAzimuthCurve() {
  // get time info for consts: date & time
  const [date, time] = getDateAndTime();
  // ###HARDCODED VALUES FOR DEV#####
  const [latitude, longitude] = ["35.11", "-106.59"];
  const reps = "1";
  const intervalMagnitude = "5";
  const intervalUnit = "minutes";

  const urlParameters = {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
  };

  fetch(getUrl(urlParameters))
    .then((res) => res.json())
    .then((data) => {
      const lmst = data.properties.data[0].lmst;
      const lmstDecimal = timeToDecimalHours(lmst);
      const hourAngle = rightAscensionDegreesToHourAngle(
        rightAscension,
        lmstDecimal
      );
      const altitude = calculateAltitudeDegrees(
        declination,
        latitude,
        hourAngle
      );
      const azimuth = calculateAzimuthDegrees(
        declination,
        latitude,
        altitude,
        hourAngle
      );

      console.log(`altitude: ${altitude}, azimuth: ${azimuth}`);
    })
    .catch((err) => console.log(err));
}

function getDateAndTime() {
  const newDate = new Date();
  const fullDate = newDate.toJSON().split("T");

  return [fullDate[0], fullDate[1].split(".")[0]];
}

function getUrl(urlParameters) {
  const {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
  } = urlParameters;

  return `https://aa.usno.navy.mil/api/siderealtime?date=${date}&coords=${latitude}, ${longitude}&reps=${reps} &intv_mag=${intervalMagnitude}&intv_unit=${intervalUnit} &time=${time}`;
}

function timeToDecimalHours(timeStr) {
  const timeParts = timeStr.split(":");
  const minutesDecimal = Number(timeParts[1] / 60);
  const secondsDecimal = Number(timeParts[2] / 3600);
  return Number(timeParts[0]) + minutesDecimal + secondsDecimal;
}

function declinationToDecimalDeclination(degrees, minutes) {
  return degrees + minutes / 60;
}

function rightAscensionToDecimalDegrees(hours, minutes) {
  const decimalHours = hours + minutes / 60;
  return decimalHours * 15;
}

//assuming right ascension entered in decimal degrees,
//localSiderealTime in decimal hours,
// returns degrees
function rightAscensionDegreesToHourAngle(rightAscension, localSiderealTime) {
  const localSiderealTimeDegrees = localSiderealTime * 15;
  const hourAngle = localSiderealTimeDegrees - rightAscension;
  if (hourAngle < 0) {
    return hourAngle + 360;
  }
  return hourAngle;
}

//assuming all entered in degrees, returns degrees
function calculateAltitudeDegrees(
  declinationDegrees,
  latitudeDegrees,
  hourAngleDegrees
) {
  const declination = declinationDegrees * degreesToRadians;
  const latitude = latitudeDegrees * degreesToRadians;
  const hourAngle = hourAngleDegrees * degreesToRadians;
  const sinAlt =
    Math.sin(declination) * Math.sin(latitude) +
    Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle);
  return Math.asin(sinAlt) * radiansToDegrees;
}

//assuming all entered in degrees, returns degrees
function calculateAzimuthDegrees(
  declinationDegrees,
  latitudeDegrees,
  altitudeDegrees,
  hourAngleDegrees
) {
  const declination = declinationDegrees * degreesToRadians;
  const latitude = latitudeDegrees * degreesToRadians;
  const altitude = altitudeDegrees * degreesToRadians;
  const hourAngle = hourAngleDegrees * degreesToRadians;

  const cosAngle =
    (Math.sin(declination) - Math.sin(altitude) * Math.sin(latitude)) /
    (Math.cos(altitude) * Math.cos(latitude));
  const angle = Math.acos(cosAngle);
  if (Math.sin(hourAngle) * radiansToDegrees < 0) {
    return angle * radiansToDegrees;
  } else {
    return 360 - angle * radiansToDegrees;
  }
}
