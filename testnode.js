const degreesToRadians = Math.PI / 180;
const radiansToDegrees = 180 / Math.PI;

// This module to act as server, manage needed updates from client, provide data in JSON format from some database,
// call to the web and update database when needed

const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      // ### CORS issues need to be addressed for non-local session 5500 port
      "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
      Vary: "Origin",
    });

    // can pull something from the request url
    const { latitude, longitude } = getUrlParameters(req.url);
    console.log(latitude, longitude);

    // ### Need to add sad path response
    getAltitudeAzimuthCurve({ latitude, longitude }).then((data) => {
      res.end(
        JSON.stringify({
          data,
        })
      );
    });
  })
  .listen(8080);

// ### Right ascension and declination should be determined by user chosen object passed through the url parameters
const rightAscension = rightAscensionToDecimalDegrees(2, 59);
const declination = declinationToDecimalDeclination(89, 21);
// call the usno api and return a list of 60 alt/az values with timestamps,
// separate by 1 minute for now, so 1 hours worth for a selected object
async function getAltitudeAzimuthCurve(parameters) {
  const { latitude, longitude } = parameters;

  const [date, time] = getDateAndTime();
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

  const res = await fetch(getUrl(urlParameters));
  const data = await res.json();
  const [altitude, azimuth] = extractAltitudeAzimuth(data, latitude);

  return [altitude, azimuth];
}

function getUrlParameters(requestUrl) {
  const parameters = requestUrl.split("?")[1].split("&");
  const latitude = parameters[0].split("=")[1];
  const longitude = parameters[1].split("=")[1];
  return { latitude, longitude };
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

function extractAltitudeAzimuth(data, latitude) {
  const lmst = data.properties.data[0].lmst;
  const lmstDecimal = timeToDecimalHours(lmst);
  const hourAngle = rightAscensionDegreesToHourAngle(
    rightAscension,
    lmstDecimal
  );
  const altitude = calculateAltitudeDegrees(declination, latitude, hourAngle);
  const azimuth = calculateAzimuthDegrees(
    declination,
    latitude,
    altitude,
    hourAngle
  );

  return [altitude, azimuth];
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
