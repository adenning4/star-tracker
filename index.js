const testButtonEl = document.getElementById("testButton");
const fetchStatusEl = document.getElementById("fetchStatus");
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
      console.log(res);
      fetchStatusEl.textContent = res.status;
      return res.json();
      // return res.text();
    })
    .then((data) => {
      console.log(data);
      altitudeResultEl.textContent = data.data.altitude;
      azimuthResultEl.textContent = data.data.azimuth;
      trackingObjectNameEl.textContent = data.data.trackingObjectName;
    })
    .catch((err) => {
      fetchStatusEl.textContent = err;
    });
}

function getRequestUrl(coordinates, trackingObject) {
  // const serverAddress = "http://127.0.0.1:8080";
  const serverAddress = "/.netlify/functions/getAltitudeAzimuthCurve";
  const latitudeRounded = Number(coordinates.latitude).toFixed(2);
  const longitudeRounded = Number(coordinates.longitude).toFixed(2);
  const coordinatesParameters = `?latitude=${latitudeRounded}&longitude=${longitudeRounded}`;

  const trackingObjectParameter = `&body=${trackingObject}`;

  const requestUrl =
    serverAddress + coordinatesParameters + trackingObjectParameter;
  // const requestUrl = serverAddress;
  console.log(requestUrl);

  return requestUrl;
}
