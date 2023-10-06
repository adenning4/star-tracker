const degreesToRadians = Math.PI / 180;
const radiansToDegrees = 180 / Math.PI;

// ###call to the web and update database when needed

const http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      // ### CORS issues need to be addressed for non-local session 5500 port
      "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
      Vary: "Origin",
    });

    const { latitude, longitude, body } = getClientRequestUrlParameters(
      req.url
    );
    console.log(latitude, longitude, body);

    // ### Need to add sad path response
    getAltitudeAzimuthCurve({ latitude, longitude, body }).then((data) => {
      res.end(
        JSON.stringify({
          data,
        })
      );
    });
  })
  .listen(8080);

// ###call the usno api and return a list of 60 alt/az values with timestamps,
// ###separate by 1 minute for now, so 1 hours worth for a selected object
async function getAltitudeAzimuthCurve(parameters) {
  const { latitude, longitude, body } = parameters;

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
    body,
  };

  const raDecRes = await fetch(getRaDecUrl(urlParameters));
  const raDecHTML = await raDecRes.text();
  const [rightAscension, declination] = getRaDecValues(raDecHTML);

  const siderialRes = await fetch(getSiderialUrl(urlParameters));
  const siderialData = await siderialRes.json();
  const [altitude, azimuth] = extractAltitudeAzimuth(
    siderialData,
    latitude,
    rightAscension,
    declination
  );

  return [altitude, azimuth];
}

function getRaDecValues(raDecHTML) {
  const rightAscensionRaw = {};
  const declinationRaw = {};
  const htmlPre = raDecHTML.match(/<pre [\s\S]+>[\s\S]+<\Spre>/gm);
  const dataLine = htmlPre[0].split(/\n/gm)[13];
  const dataLineParts = dataLine.split(/\s{3,}/);
  console.log(dataLineParts);

  rightAscensionRaw.hours = dataLineParts[1].split(" ")[0];
  rightAscensionRaw.minutes = dataLineParts[1].split(" ")[1];
  rightAscensionRaw.seconds = dataLineParts[1].split(" ")[2];

  const declinationData = dataLineParts[2].split(/\+|-/)[1].trim();
  declinationRaw.degrees = declinationData.split(" ")[0];
  declinationRaw.minutes = declinationData.split(" ")[1];
  declinationRaw.seconds = declinationData.split(" ")[2];
  declinationRaw.sign = dataLineParts[2].match(/\+|-/)[0];

  const rightAscension = rightAscensionToDecimalDegrees(rightAscensionRaw);
  const declination = declinationToDecimalDeclination(declinationRaw);

  return [rightAscension, declination];
}

function getRaDecUrl(urlParameters) {
  const {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
    body,
  } = urlParameters;

  const intervalUnitOptions = ["placeholder", "days, hours, minutes, seconds"];
  const formattedIntervalUnit = intervalUnitOptions.indexOf(intervalUnit);

  const [hours, minutes, seconds] = time.split(":");
  const formattedTime = `${hours}%3A${minutes}%3A${seconds}`;

  const url = `https://aa.usno.navy.mil/calculated/positions/topocentric?ID=AA&task=8&body=${body}&date=${date}&time=${formattedTime}&intv_mag=${intervalMagnitude}&intv_unit=${formattedIntervalUnit}&reps=${reps}&lat=${latitude}&lon=${longitude}&label=&height=1676&submit=Get+Data`;

  console.log(`RaDec Url: ${url}`);

  return url;
}

function getSiderialUrl(urlParameters) {
  const {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
  } = urlParameters;

  const url = `https://aa.usno.navy.mil/api/siderealtime?date=${date}&coords=${latitude}, ${longitude}&reps=${reps} &intv_mag=${intervalMagnitude}&intv_unit=${intervalUnit} &time=${time}`;

  console.log(`Siderial Url: ${url}`);

  return url;
}

function getClientRequestUrlParameters(requestUrl) {
  const parameters = requestUrl.split("?")[1].split("&");
  const latitude = parameters[0].split("=")[1];
  const longitude = parameters[1].split("=")[1];
  const body = parameters[2].split("=")[1];
  return { latitude, longitude, body };
}

function getDateAndTime() {
  const newDate = new Date();
  const fullDate = newDate.toJSON().split("T");

  return [fullDate[0], fullDate[1].split(".")[0]];
}

function extractAltitudeAzimuth(data, latitude, rightAscension, declination) {
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

function declinationToDecimalDeclination({ degrees, minutes, seconds, sign }) {
  if (sign === "-") {
    return Number(degrees) * -1 + Number(minutes) / 60 + Number(seconds) / 3600;
  } else {
    return Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;
  }
}

function rightAscensionToDecimalDegrees({ hours, minutes, seconds }) {
  const decimalHours =
    Number(hours) + Number(minutes) / 60 + Number(seconds) / 3600;
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
