import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
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
const cardinalResultEl = document.getElementById("cardinalResult");
const trackingTargetNameEl = document.getElementById("trackingTargetName");
const trackingObjectSelectionEl = document.getElementById(
  "trackingObjectSelection"
);
const clockEl = document.getElementById("clock");
const dataTimestampEl = document.getElementById("dataTimestamp");
const startTrackingButtonEl = document.getElementById("startTrackingButton");
const stopTrackingButtonEl = document.getElementById("stopTrackingButton");
const getMyLocationButtonEl = document.getElementById("getLocationButton");
const azimuthResultArrowEl = document.getElementById("azimuthResultArrow");

let fetchCount = null;

startTrackingButtonEl.disabled = true;
stopTrackingButtonEl.disabled = true;

const mainClockId = setInterval(() => {
  const date = new Date();
  clockEl.textContent = date.toTimeString();
}, 1000);

// ### need to build manual input option for declined/unsuccessful requests

getMyLocationButtonEl.addEventListener("click", () => {
  getCoordinates();
});

const workerHandler = {
  mainWorker: null,
};

// #what if no workers?
startTrackingButtonEl.addEventListener("click", () => {
  if (window.Worker) {
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
      workerHandler.mainWorker.postMessage(JSON.stringify(messageToMain));
    });

    console.log("start button");
    const messageToMain = {
      directive: "startTracking",
      body: {
        coordinates: {
          latitude: latitudeInputEl.value,
          longitude: longitudeInputEl.value,
        },
        trackingObject: trackingObjectSelectionEl.value,
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
          altitudeResultEl.textContent = messageFromMainWorker.body.altitude;
          azimuthResultEl.textContent = messageFromMainWorker.body.azimuth;
          cardinalResultEl.textContent = messageFromMainWorker.body.cardinal;
          applyVisual(messageFromMainWorker.body.azimuth);
          break;
        case "addFetchCount":
          set(numberOfFetchesInDB, fetchCount + 1);
          break;
      }
    };
  }
});

function applyVisual(number) {
  console.log(number);
  // azimuthResultEl.dataset.angle = number;
  // azimuthResultEl.dataset.angle = `rotateZ(${number}deg)`;
  azimuthResultArrowEl.style.cssText = `
    background-color: red;
    width: 80px;
    height: 10px;
    transform-origin: left;
    transform: rotateZ(${number}deg)
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
      getMyLocationButtonEl.innerHTML = `Get My Location`;
    },
    (err) => {
      console.warn(`ERROR(${err.code}): ${err.message}`);
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
  trackingTargetNameEl.innerHTML = loadingSpinner;
  dataTimestampEl.innerHTML = loadingSpinner;
  altitudeResultEl.innerHTML = loadingSpinner;
  azimuthResultEl.innerHTML = loadingSpinner;
  cardinalResultEl.innerHTML = loadingSpinner;
}
