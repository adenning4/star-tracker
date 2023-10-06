const testButtonEl = document.getElementById("testButton");
const fetchStatusEl = document.getElementById("fetchStatus");
// #######
const apiTestButtonEl = document.getElementById("apiTestButton");
// ######
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

// #########
apiTestButtonEl.addEventListener("click", () => getAltitudeAzimuthCurve());
// ########

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

// ######### ALL BELOW WILL MOVE TO THE SERVER ##############
//            KEEP FOR NOW FOR DEV
const degreesToRadians = Math.PI / 180;
const radiansToDegrees = 180 / Math.PI;
// call the usno api and return a list of 60 alt/az values with timestamps,
// separate by 1 minute for now, so 1 hours worth for a selected object
function getAltitudeAzimuthCurve() {
  // get time info for consts: date & time
  const [date, time] = getDateAndTime();
  // ###HARDCODED VALUES FOR DEV#####
  const [latitude, longitude] = ["35.11", "-106.59"];
  const reps = "1";
  const intervalMagnitude = "5";
  const intervalUnit = "minutes";

  const urlParameters = {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
  };
  console.log(getUrl(urlParameters));
  fetch(getUrl(urlParameters))
    .then((res) => {
      return res.json();
    })
    // .then((data) => {
    //   console.log(data.properties);
    // })
    .catch((err) => console.log(err));
}

function getDateAndTime() {
  const newDate = new Date();
  const fullDate = newDate.toJSON().split("T");

  return [fullDate[0], fullDate[1].split(".")[0]];
}

function getUrl(urlParameters) {
  const {
    date,
    time,
    latitude,
    longitude,
    reps,
    intervalMagnitude,
    intervalUnit,
  } = urlParameters;

  return `https://aa.usno.navy.mil/api/siderealtime?date=${date}&coords=${latitude}, ${longitude}&reps=${reps} &intv_mag=${intervalMagnitude}&intv_unit=${intervalUnit} &time=${time}`;
}
