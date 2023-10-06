const testButtonEl = document.getElementById("testButton");
const fetchStatusEl = document.getElementById("fetchStatus");
const latitudeInputEl = document.getElementById("latitudeInput");
const longitudeInputEl = document.getElementById("longitudeInput");
const altitudeResultEl = document.getElementById("altitudeResult");
const azimuthResultEl = document.getElementById("azimuthResult");
const trackingObjectSelectionEl = document.getElementById(
  "trackingObjectSelection"
);

// ### need to build manual input option for declined/unsuccessful requests
// ### need to create some behavior that keeps the user from requesting data til this is resolved
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
      fetchStatusEl.textContent = res.status;
      return res.json();
    })
    .then((data) => {
      console.log(data.data);
      altitudeResultEl.textContent = data.data[0].toFixed(4);
      azimuthResultEl.textContent = data.data[1].toFixed(4);
    })
    .catch((err) => (fetchStatusEl.textContent = err));
}

function getRequestUrl(coordinates, trackingObject) {
  const serverAddress = "http://127.0.0.1:8080";
  const latitudeRounded = Number(coordinates.latitude).toFixed(2);
  const longitudeRounded = Number(coordinates.longitude).toFixed(2);
  const coordinatesParameters = `?latitude=${latitudeRounded}&longitude=${longitudeRounded}`;

  const trackingObjectParameter = `&body=${trackingObject}`;

  const requestUrl =
    serverAddress + coordinatesParameters + trackingObjectParameter;

  console.log(requestUrl);
  return requestUrl;
}
