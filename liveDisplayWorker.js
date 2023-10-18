let intervalId = null;
onmessage = (e) => {
  const messageFromMainWorker = JSON.parse(e.data);
  switch (messageFromMainWorker.directive) {
    case "synchronizeDataArray":
      console.log("synchronizeDataArray");

      clearInterval(intervalId);
      const altAzTimeCurveArray = messageFromMainWorker.body.altAzTimeCurve;
      const trackingObjectName = messageFromMainWorker.body.trackingObjectName;
      const dataLength = altAzTimeCurveArray.length;
      // 15 second buffer
      const dataLengthBuffer = dataLength - 15;
      let i = 0;
      let isFetchingMore = false;
      intervalId = setInterval(() => {
        if (i === dataLength) {
          clearInterval(intervalId);
          return;
        }

        // synchronize the usno timestamps with any local machine time
        // synchronization only expected needed on first pass
        if (i === 0) {
          const mainClockDate = new Date();
          const timestampDateSyncRef = new Date(altAzTimeCurveArray[i].time);
          const dataDelaySeconds = Math.round(
            (mainClockDate - timestampDateSyncRef) / 1000
          );
          console.log(`Fetch data delay: ${dataDelaySeconds}s`);
          i += dataDelaySeconds;
        }
        const timestampDate = new Date(altAzTimeCurveArray[i].time);
        const liveData = {
          trackingTarget: trackingObjectName,
          dataTimeStamp: timestampDate.toLocaleTimeString(),
          altitude: altAzTimeCurveArray[i].alt,
          azimuth: altAzTimeCurveArray[i].az,
          cardinal: altAzTimeCurveArray[i].cardinal,
        };
        // ### need to change logic depending on chosen interval size and amount left considering average fetch times (2-4 seconds). This logic assumes 30 seconds of data supplied at 1 second intervals
        if (!isFetchingMore && i > dataLengthBuffer) {
          isFetchingMore = true;
          const messageToMainWorker = {
            directive: "fetchMoreData",
            body: null,
          };
          postMessage(JSON.stringify(messageToMainWorker));
        }

        const messageToMainWorker = {
          directive: "displayLiveData",
          body: liveData,
        };
        postMessage(JSON.stringify(messageToMainWorker));
        i++;
      }, 1000);

      break;
  }
};
