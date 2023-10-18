import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  get,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
  databaseURL: "https://star-tracker-1bd78-default-rtdb.firebaseio.com/",
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const numberOfFetchesInDB = ref(database, "numberOfFetches");

const latitudeInputEl = document.getElementById("latitudeInput");
const longitudeInputEl = document.getElementById("longitudeInput");
const altitudeResultEl = document.getElementById("altitudeResult");
const azimuthResultEl = document.getElementById("azimuthResult");
const trackingTargetNameEl = document.getElementById("trackingTargetName");
const trackingObjectSelectionEl = document.getElementById(
  "trackingObjectSelection"
);
// const clockEl = document.getElementById("clock");
const dataTimestampEl = document.getElementById("dataTimestamp");
const startTrackingButtonEl = document.getElementById("startTrackingButton");
const stopTrackingButtonEl = document.getElementById("stopTrackingButton");
const getMyLocationButtonEl = document.getElementById("getLocationButton");
const azimuthResultArrowEl = document.getElementById("azimuthResultArrow");
const altitudeResultArrowEl = document.getElementById("altitudeResultArrow");

let fetchCount = null;

startTrackingButtonEl.disabled = true;
stopTrackingButtonEl.disabled = true;

// const mainClockId = setInterval(() => {
//   const date = new Date();
//   clockEl.textContent = date.toTimeString();
// }, 1000);

// ### need to build manual input option for declined/unsuccessful requests

getMyLocationButtonEl.addEventListener("click", () => {
  getCoordinates();
});

const workerHandler = {
  mainWorker: null,
};

get(numberOfFetchesInDB).then((snapshot) => {
  fetchCount = snapshot.val();
  console.log("initial fetch count complete");
});

// #what if no workers?
startTrackingButtonEl.addEventListener("click", () => {
  if (window.Worker && fetchCount) {
    if (workerHandler.mainWorker) {
      workerHandler.mainWorker.terminate();
    }
    workerHandler.mainWorker = new Worker("mainWorker.js");
    indicateLoading();

    onValue(numberOfFetchesInDB, (snapshot) => {
      fetchCount = snapshot.val();
      const messageToMain = {
        directive: "updateFetchCount",
        body: fetchCount,
      };
      console.log(`updating main with fetch count: ${fetchCount}`);
      workerHandler.mainWorker.postMessage(JSON.stringify(messageToMain));
    });

    // console.log("start button");
    const messageToMain = {
      directive: "startTracking",
      body: {
        coordinates: {
          latitude: latitudeInputEl.value,
          longitude: longitudeInputEl.value,
        },
        trackingObject: trackingObjectSelectionEl.value,
        fetchCount,
      },
    };
    workerHandler.mainWorker.postMessage(JSON.stringify(messageToMain));

    stopTrackingButtonEl.addEventListener("click", () => {
      if (workerHandler.mainWorker) {
        workerHandler.mainWorker.terminate();
        workerHandler.mainWorker = null;
        stopTrackingButtonEl.disabled = true;
      }
    });

    workerHandler.mainWorker.onmessage = (e) => {
      const messageFromMainWorker = JSON.parse(e.data);
      switch (messageFromMainWorker.directive) {
        case "displayLiveData":
          stopTrackingButtonEl.disabled = false;
          trackingTargetNameEl.textContent =
            messageFromMainWorker.body.trackingTarget;
          dataTimestampEl.textContent =
            messageFromMainWorker.body.dataTimeStamp;
          altitudeResultEl.textContent = `${messageFromMainWorker.body.altitude}°`;
          azimuthResultEl.textContent = `${messageFromMainWorker.body.azimuth}° (${messageFromMainWorker.body.cardinal})`;
          applyVisual(
            messageFromMainWorker.body.altitude,
            messageFromMainWorker.body.azimuth
          );
          break;
        case "addFetchCount":
          set(numberOfFetchesInDB, fetchCount + 1);
          break;
      }
    };

    workerHandler.mainWorker.onerror = (e) => {
      alert("Error: Check console for details");
      console.log(e.data);
      indicateError();
    };
  } else {
    indicateError();
    throw "Error: try again";
  }
});

function applyVisual(altitudeAngle, azimuthAngle) {
  const cssAltitudeAngle = altitudeAngle - 180;
  const cssAzimuthAngle = azimuthAngle - 90;
  altitudeResultArrowEl.style.cssText = `
  transform: rotateZ(${cssAltitudeAngle}deg)
  `;
  azimuthResultArrowEl.style.cssText = `
    transform: rotateZ(${cssAzimuthAngle}deg)
  `;
}

longitudeInputEl.addEventListener("change", setStartTrackingButton);
latitudeInputEl.addEventListener("change", setStartTrackingButton);

function setStartTrackingButton() {
  if (isLocationEntered()) {
    startTrackingButtonEl.disabled = false;
  } else {
    startTrackingButtonEl.disabled = true;
  }
}

function getCoordinates() {
  getMyLocationButtonEl.innerHTML = `
    Getting Location <i class="fa-solid fa-spinner fa-spin-pulse"></i>
  `;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latitudeInputEl.value = pos.coords.latitude;
      longitudeInputEl.value = pos.coords.longitude;
      setStartTrackingButton();
      getMyLocationButtonEl.textContent = `Get My Location`;
    },
    (err) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
      getMyLocationButtonEl.textContent = `Denied - Input Location Manually`;
      getMyLocationButtonEl.style.cssText = `
        background: var(--darkYellowColor);
        color: var(--lightYellowColor);
        border: 2px solid var(--lightYellowColor);
      `;
    },
    {
      timeout: 5000,
    }
  );
}

function isLocationEntered() {
  return !!latitudeInputEl.value && !!longitudeInputEl.value;
}

function indicateLoading() {
  const loadingSpinner = `<i class="fa-solid fa-spinner fa-spin-pulse"></i>`;
  dataTimestampEl.innerHTML = loadingSpinner;
  trackingTargetNameEl.textContent = "-";
  altitudeResultEl.textContent = "-";
  azimuthResultEl.textContent = "-";
}

function indicateError() {
  dataTimestampEl.textContent = "ERROR!";
}
