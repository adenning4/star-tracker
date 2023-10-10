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

//## addfunction to process AZ value into N, NE, SW, ect...

setInterval(() => {
  const date = new Date();
  clockEl.textContent = date.toTimeString();
}, 1000);

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

function getServerData() {
  const coordinates = {
    latitude: latitudeInputEl.value,
    longitude: longitudeInputEl.value,
  };
  const trackingObject = trackingObjectSelectionEl.value;
  fetch(getRequestUrl(coordinates, trackingObject))
    .then((res) => {
      // fetchStatusEl.textContent = res.status;
      return res.json();
    })
    .then((data) => {
      trackingObjectNameEl.textContent = data.trackingObjectName;
      displayLiveCoordinates(data.altAzTimeCurve);
    })
    .catch((err) => {
      console.log(err);
      // fetchStatusEl.textContent = err;
    });
}

function displayLiveCoordinates(altAzTimeCurveArray) {
  let i = 0;
  console.log(`length: ${altAzTimeCurveArray.length}`);
  const intervalId = setInterval(() => {
    console.log(`i: ${i}`);
    if (i === altAzTimeCurveArray.length) {
      clearInterval(intervalId);
      console.log("end of data");
      return;
    }
    altitudeResultEl.textContent = altAzTimeCurveArray[i].altitude;
    azimuthResultEl.textContent = altAzTimeCurveArray[i].azimuth;
    i++;
  }, 1000);
}

function getRequestUrl(coordinates, trackingObject) {
  const serverAddress = "/.netlify/functions/getAltitudeAzimuthCurve";
  const latitudeRounded = Number(coordinates.latitude).toFixed(2);
  const longitudeRounded = Number(coordinates.longitude).toFixed(2);
  const coordinatesParameters = `?latitude=${latitudeRounded}&longitude=${longitudeRounded}`;

  const trackingObjectParameter = `&body=${trackingObject}`;

  const requestUrl =
    serverAddress + coordinatesParameters + trackingObjectParameter;

  return requestUrl;
}
