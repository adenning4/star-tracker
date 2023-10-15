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
const trackingObjectNameEl = document.getElementById("trackingObjectName");
const trackingObjectSelectionEl = document.getElementById(
  "trackingObjectSelection"
);
const clockEl = document.getElementById("clock");
const dataTimestampEl = document.getElementById("dataTimestamp");
const mainWorkerButtonEl = document.getElementById("mainWorkerButton");

let fetchCount = null;

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
// May be able to move this to a worker
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

// #what if no workers?
if (window.Worker) {
  const mainWorker = new Worker("mainWorker.js");

  onValue(numberOfFetchesInDB, (snapshot) => {
    fetchCount = snapshot.val();
    const messageToMain = {
      directive: "updateFetchCount",
      body: fetchCount,
    };
    mainWorker.postMessage(JSON.stringify(messageToMain));
  });

  mainWorkerButtonEl.addEventListener("click", () => {
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
    mainWorker.postMessage(JSON.stringify(messageToMain));
  });

  mainWorker.onmessage = (e) => {
    const messageFromIndex = JSON.parse(e.data);
    switch (messageFromIndex.directive) {
      case "displayLiveData":
        dataTimestampEl.textContent = messageFromIndex.body.dataTimeStamp;
        altitudeResultEl.textContent = messageFromIndex.body.altitude;
        azimuthResultEl.textContent = messageFromIndex.body.azimuth;
        cardinalResultEl.textContent = messageFromIndex.body.cardinal;
        break;
      case "addFetchCount":
        set(numberOfFetchesInDB, fetchCount + 1);
        break;
    }
  };
}
