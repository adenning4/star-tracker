onmessage = (e) => {
  const { coordinates, trackingObject } = JSON.parse(e.data);
  const preparedResponse = {};

  fetch(getRequestUrl(coordinates, trackingObject))
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      preparedResponse.trackingObjectName = data.trackingObjectName;
      preparedResponse.altAzTimeCurve = data.altAzTimeCurve;
      this.postMessage(JSON.stringify(preparedResponse));
    })
    .catch((err) => {
      console.log(err);
      console.log(`Server error reponse in worker: ${err}`);
    });
};

function getRequestUrl(coordinates, trackingObject) {
  const serverAddress = "/.netlify/functions/getAltitudeAzimuthCurve";
  const latitudeRounded = Number(coordinates.latitude).toFixed(2);
  const longitudeRounded = Number(coordinates.longitude).toFixed(2);
  const coordinatesParameters = `?latitude=${latitudeRounded}&longitude=${longitudeRounded}`;

  const trackingObjectParameter = `&body=${trackingObject}`;

  const { date, time } = getDateAndTime();
  const userTimeParameters = `&date=${date}&time=${time}`;
  const requestUrl =
    serverAddress +
    coordinatesParameters +
    trackingObjectParameter +
    userTimeParameters;

  return requestUrl;
}

function getDateAndTime() {
  const newDate = new Date();
  const fullDate = newDate.toJSON().split("T");

  return { date: fullDate[0], time: fullDate[1].split(".")[0] };
}
