const degreesToRadians = Math.PI / 180;
const radiansToDegrees = 180 / Math.PI;

// ### Need more sophisticated server handling
// ### Client hangs while server performs api calls and data preparation
exports.handler = async function (event, context) {
  const parameters = event.queryStringParameters;
  const data = await getAltitudeAzimuthCurve(parameters);

  return {
    headers: {
      "content-type": "application/json",
    },
    statusCode: 200,
    body: JSON.stringify(data),
  };
};

// ###call the usno api and return a list of 60 alt/az values with timestamps,
// ###separate by 1 minute for now, so 1 hours worth for a selected object
async function getAltitudeAzimuthCurve(parameters) {
  const { latitude, longitude, body } = parameters;
  // const { latitude, longitude, body, date, time } = parameters;

  const reps = "30";
  const intervalMagnitude = "1";
  const intervalUnit = "seconds";

  const { date, time } = getDateAndTime();

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
  const { raDecTimeCurve, trackingObjectName } = getRaDecObjectValues(
    raDecHTML,
    reps
  );

  const siderialRes = await fetch(getSiderialUrl(urlParameters));
  const siderialData = await siderialRes.json();

  const altAzTimeCurve = extractAltitudeAzimuthTimeArray(
    siderialData,
    latitude,
    raDecTimeCurve
  );

  return { trackingObjectName, altAzTimeCurve };
}

function getDateAndTime() {
  const newDate = new Date();
  const fullDate = newDate.toJSON().split("T");

  return { date: fullDate[0], time: fullDate[1].split(".")[0] };
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

  const intervalUnitOptions = [
    "placeholder",
    "days",
    "hours",
    "minutes",
    "seconds",
  ];
  const formattedIntervalUnit = intervalUnitOptions.indexOf(intervalUnit);

  const [hours, minutes, seconds] = time.split(":");
  const formattedTime = `${hours}%3A${minutes}%3A${seconds}`;

  const url = `https://aa.usno.navy.mil/calculated/positions/topocentric?ID=AA&task=8&body=${body}&date=${date}&time=${formattedTime}&intv_mag=${intervalMagnitude}&intv_unit=${formattedIntervalUnit}&reps=${reps}&lat=${latitude}&lon=${longitude}&label=&height=1676&submit=Get+Data`;

  return url;
}
function getRaDecObjectValues(raDecHTML, reps) {
  const raDecTimeCurve = [];
  const htmlPre = raDecHTML.match(/<pre [\s\S]+>[\s\S]+<\Spre>/gm);
  const trackingObjectName = htmlPre[0].split(/\n/gm)[1].trim();

  for (let i = 0; i < reps; i++) {
    const rightAscensionRaw = {};
    const declinationRaw = {};

    const dataLine = htmlPre[0].split(/\n/gm)[13 + i];
    const dataLineParts = dataLine.split(/\s{3,}/);

    const timestamp = getTimestampFromHtml(dataLineParts[0]);

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

    raDecTimeCurve.push({ timestamp, rightAscension, declination });
  }
  return { raDecTimeCurve, trackingObjectName };
}

function getTimestampFromHtml(timeData) {
  const timeDataParts = timeData.split(" ");
  const year = timeDataParts[0];
  const monthName = timeDataParts[1];
  const monthNameArray = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNameArray.indexOf(monthName);
  const day = Number(timeDataParts[2]);
  const hourMinuteSecondsParts = timeDataParts[3].split(":");
  const hour = Number(hourMinuteSecondsParts[0]);
  const minute = Number(hourMinuteSecondsParts[1]);
  const second = Number(hourMinuteSecondsParts[2].split(".")[0]);
  // Calling this is screwing up the date
  // return new Date(year, month, day, hour, minute, second);
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function rightAscensionToDecimalDegrees({ hours, minutes, seconds }) {
  const decimalHours =
    Number(hours) + Number(minutes) / 60 + Number(seconds) / 3600;
  return decimalHours * 15;
}

function declinationToDecimalDeclination({ degrees, minutes, seconds, sign }) {
  if (sign === "-") {
    return Number(degrees) * -1 + Number(minutes) / 60 + Number(seconds) / 3600;
  } else {
    return Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;
  }
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

  return url;
}

function extractAltitudeAzimuthTimeArray(
  siderialData,
  latitude,
  raDecTimeCurve
) {
  const altitudeAzimuthTimeArray = raDecTimeCurve.map((item, index) => {
    const hourAngle = rightAscensionDegreesToHourAngle(
      item.rightAscension,
      timeToDecimalHours(siderialData.properties.data[index].lmst)
    );
    const altitudeValue = calculateAltitudeDegrees(
      item.declination,
      latitude,
      hourAngle
    );
    return {
      time: item.timestamp,
      alt: altitudeValue.toFixed(4),
      az: calculateAzimuthDegrees(
        item.declination,
        latitude,
        altitudeValue,
        hourAngle
      ).toFixed(4),
    };
  });

  return altitudeAzimuthTimeArray;
}

function timeToDecimalHours(timeStr) {
  const timeParts = timeStr.split(":");
  const minutesDecimal = Number(timeParts[1] / 60);
  const secondsDecimal = Number(timeParts[2] / 3600);
  return Number(timeParts[0]) + minutesDecimal + secondsDecimal;
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
