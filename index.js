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
const mainWorkerButtonEl = document.getElementById("mainWorkerButton");

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

if (window.Worker) {
  const mainWorker = new Worker("mainWorker.js");

  mainWorkerButtonEl.addEventListener("click", () => {
    const dataPrompt = {
      directive: "startTracking",
      body: {
        coordinates: {
          latitude: latitudeInputEl.value,
          longitude: longitudeInputEl.value,
        },
        trackingObject: trackingObjectSelectionEl.value,
      },
    };
    console.log(`Sending message from index to mainWorker`);
    mainWorker.postMessage(dataPrompt);
  });

  mainWorker.onmessage = (e) => {
    const currentData = JSON.parse(e.data);
    // console.log(currentData);
    dataTimestampEl.textContent = currentData.dataTimeStamp;
    altitudeResultEl.textContent = currentData.altitude;
    azimuthResultEl.textContent = currentData.azimuth;
  };
}
