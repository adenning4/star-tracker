const testButtonEl = document.getElementById("testButton");
const fetchStatusEl = document.getElementById("fetchStatus");
const coordinates = {
  latitude: 0,
  longitude: 0,
};

// user should be prompted for location data first
// need to build manual input option for declined/unsuccessful requests
// coordinates must be passed through the url to request the right data
// need to create some behavior that keeps the user from requesting data til this is resolved
navigator.geolocation.getCurrentPosition(
  (pos) => {
    coordinates.latitude = pos.coords.latitude;
    coordinates.longitude = pos.coords.longitude;
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
  // need to build a URL with user input
  // coordinates, object, ...
  fetch("http://127.0.0.1:8080/test1")
    // .then((res) => console.log(res))
    .then((res) => {
      fetchStatusEl.textContent = res.status;
      return res.json();
    })
    .then((data) => console.log(data))
    .catch((err) => (fetchStatusEl.textContent = err));
}
