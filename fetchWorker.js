onmessage = (e) => {
  const messageFromMainWorker = JSON.parse(e.data);
  switch (messageFromMainWorker.directive) {
    case "serverlessFetch":
      const { coordinates, trackingObject } = messageFromMainWorker.body;

      fetch(getServerlessRequestUrl(coordinates, trackingObject))
        .then((res) => res.json())
        .then((data) => {
          const messageToMainWorker = {
            directive: "useUpdatedData",
            body: {
              trackingObjectName: data.trackingObjectName,
              altAzTimeCurve: data.altAzTimeCurve,
            },
          };
          postMessage(JSON.stringify(messageToMainWorker));
        })
        .catch((err) => {
          console.log(err);
          console.log(`Server error reponse in worker: ${err}`);
          indicateFetchWorkerError();
        });

      break;
    case "proxyFetch":
      console.log("proxyFetch");
      indicateFetchWorkerError();
      break;
  }
};

function getServerlessRequestUrl(coordinates, trackingObject) {
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

function indicateFetchWorkerError() {
  const messageToMainWorker = {
    directive: "notifyFetchError",
    body: null,
  };
  this.postMessage(JSON.stringify(messageToMainWorker));
  throw "fetchWorker error";
}
