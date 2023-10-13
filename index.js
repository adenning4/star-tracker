const testButtonEl = document.getElementById("testButton");
// const fetchStatusEl = document.getElementById("fetchStatus");
const latitudeInputEl = document.getElementById("latitudeInput");
const longitudeInputEl = document.getElementById("longitudeInput");
const altitudeResultEl = document.getElementById("altitudeResult");
const azimuthResultEl = document.getElementById("azimuthResult");
const trackingObjectNameEl = document.getElementById("trackingObjectName");
const trackingObjectSelectionEl = document.getElementById(
  "trackingObjectSelection"
);
const clockEl = document.getElementById("clock");
const dataTimestampEl = document.getElementById("dataTimestamp");
const workerButtonEl = document.getElementById("testWorker");

//## addfunction to process AZ value into N, NE, SW, ect... may do on server side
let mainClockId = null;

function runMainClock() {
  mainClockId = setInterval(() => {
    const date = new Date();
    clockEl.textContent = date.toTimeString();
  }, 1000);
}

runMainClock();

// ### need to build manual input option for declined/unsuccessful requests
// ### need to create some behavior that keeps the user from requesting data til this is resolved
//### need to add a button to grab the user's location, rather than auto grabbing it
navigator.geolocation.getCurrentPosition(
  (pos) => {
    latitudeInputEl.value = pos.coords.latitude;
    longitudeInputEl.value = pos.coords.longitude;
  },
  (err) => {
    console.warn(`ERROR(${err.code}): ${err.message}`);
  },
  {
    timeout: 5000,
  }
);

testButtonEl.addEventListener("click", () => {
  getServerData();
});

if (window.Worker) {
  const myWorker = new Worker("worker.js");

  workerButtonEl.addEventListener("click", () => {
    const workerPrompt = {
      coordinates: {
        latitude: latitudeInputEl.value,
        longitude: longitudeInputEl.value,
      },
      trackingObject: trackingObjectSelectionEl.value,
    };

    myWorker.postMessage(JSON.stringify(workerPrompt));
  });

  myWorker.onmessage = (e) => {
    const { trackingObjectName, altAzTimeCurve } = JSON.parse(e.data);
    trackingObjectNameEl.textContent = trackingObjectName;
    displayLiveCoordinates(altAzTimeCurve);
  };
}

function getServerData() {
  console.log("disconnected");
  // const coordinates = {
  //   latitude: latitudeInputEl.value,
  //   longitude: longitudeInputEl.value,
  // };
  // const trackingObject = trackingObjectSelectionEl.value;
  // fetch(getRequestUrl(coordinates, trackingObject))
  //   .then((res) => {
  //     // fetchStatusEl.textContent = res.status;
  //     return res.json();
  //   })
  //   .then((data) => {
  //     console.log(data);
  //     trackingObjectNameEl.textContent = data.trackingObjectName;
  //     displayLiveCoordinates(data.altAzTimeCurve);
  //   })
  //   .catch((err) => {
  //     console.log(err);
  //     // fetchStatusEl.textContent = err;
  //   });
}

//### need to synchronize with system time and clock
function displayLiveCoordinates(altAzTimeCurveArray) {
  const dataLength = altAzTimeCurveArray.length;
  let i = 0;
  clearInterval(mainClockId);
  const intervalId = setInterval(() => {
    if (i === dataLength) {
      clearInterval(intervalId);
      runMainClock();
      return;
    }
    const mainClockDate = new Date();
    clockEl.textContent = mainClockDate.toTimeString();
    const timestampDate = new Date(altAzTimeCurveArray[i].time);
    // ### Need to synchronize the usno timestamps with any local machine time for proper synchronization
    const dataDelaySeconds = Math.round((mainClockDate - timestampDate) / 1000);
    // console.log((mainClockDate - timestampDate) / 1000);
    // console.log(dataDelaySeconds);
    i += dataDelaySeconds;
    dataTimestampEl.textContent = timestampDate.toTimeString();
    altitudeResultEl.textContent = altAzTimeCurveArray[i].alt;
    azimuthResultEl.textContent = altAzTimeCurveArray[i].az;
    console.log(getAzimuthCardinalDirections(altAzTimeCurveArray[i].az));
    i++;
  }, 1000);
}

function getAzimuthCardinalDirections(azimuthDegrees) {
  if (
    (azimuthDegrees >= 0 && azimuthDegrees < 11.25) ||
    (azimuthDegrees >= 348.75 && azimuthDegrees <= 360)
  ) {
    return "N";
  } else if (azimuthDegrees >= 11.25 && azimuthDegrees < 33.75) {
    return "NNE";
  } else if (azimuthDegrees >= 33.75 && azimuthDegrees < 56.25) {
    return "NE";
  } else if (azimuthDegrees >= 56.25 && azimuthDegrees < 78.75) {
    return "ENE";
  } else if (azimuthDegrees >= 78.75 && azimuthDegrees < 101.25) {
    return "E";
  } else if (azimuthDegrees >= 101.25 && azimuthDegrees < 123.75) {
    return "ESE";
  } else if (azimuthDegrees >= 123.75 && azimuthDegrees < 146.25) {
    return "SE";
  } else if (azimuthDegrees >= 146.25 && azimuthDegrees < 168.75) {
    return "SSE";
  } else if (azimuthDegrees >= 168.75 && azimuthDegrees < 191.25) {
    return "S";
  } else if (azimuthDegrees >= 191.25 && azimuthDegrees < 213.75) {
    return "SSW";
  } else if (azimuthDegrees >= 213.75 && azimuthDegrees < 236.25) {
    return "SW";
  } else if (azimuthDegrees >= 236.25 && azimuthDegrees < 258.75) {
    return "WSW";
  } else if (azimuthDegrees >= 258.75 && azimuthDegrees < 281.25) {
    return "W";
  } else if (azimuthDegrees >= 281.25 && azimuthDegrees < 303.75) {
    return "WNW";
  } else if (azimuthDegrees >= 303.75 && azimuthDegrees < 326.25) {
    return "NW";
  } else if (azimuthDegrees >= 326.25 && azimuthDegrees < 348.75) {
    return "NNW";
  }
}

// function getRequestUrl(coordinates, trackingObject) {
//   const serverAddress = "/.netlify/functions/getAltitudeAzimuthCurve";
//   const latitudeRounded = Number(coordinates.latitude).toFixed(2);
//   const longitudeRounded = Number(coordinates.longitude).toFixed(2);
//   const coordinatesParameters = `?latitude=${latitudeRounded}&longitude=${longitudeRounded}`;

//   const trackingObjectParameter = `&body=${trackingObject}`;

//   const { date, time } = getDateAndTime();
//   const userTimeParameters = `&date=${date}&time=${time}`;
//   const requestUrl =
//     serverAddress +
//     coordinatesParameters +
//     trackingObjectParameter +
//     userTimeParameters;

//   return requestUrl;
// }

// function getDateAndTime() {
//   const newDate = new Date();
//   const fullDate = newDate.toJSON().split("T");

//   return { date: fullDate[0], time: fullDate[1].split(".")[0] };
// }
