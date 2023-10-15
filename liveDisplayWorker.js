let intervalId = null;
onmessage = (e) => {
  const data = JSON.parse(e.data);
  // displayLiveCoordinates(data.altAzTimeCurve);

  const altAzTimeCurveArray = data.altAzTimeCurve;
  const dataLength = altAzTimeCurveArray.length;
  let i = 0;
  clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (i === dataLength) {
      clearInterval(intervalId);
      return;
    }
    const mainClockDate = new Date();

    // synchronize the usno timestamps with any local machine time
    // synchronization only expected needed on first pass
    if (i === 0) {
      const timestampDateSyncRef = new Date(altAzTimeCurveArray[i].time);
      const dataDelaySeconds = Math.round(
        (mainClockDate - timestampDateSyncRef) / 1000
      );
      console.log(`Fetch data delay: ${dataDelaySeconds}s`);
      i += dataDelaySeconds;
    }
    const timestampDate = new Date(altAzTimeCurveArray[i].time);
    const liveData = {
      dataTimeStamp: timestampDate.toTimeString(),
      altitude: altAzTimeCurveArray[i].alt,
      azimuth: altAzTimeCurveArray[i].az,
    };
    // ### need to change logic depending on chosen interval size and amount left considering average fetch times. This logic assumes 30 seconds of data supplied at 1 second intervals
    const isDataShort = i > 20 ? true : false;
    const liveDisplayWorkerResult = {
      isDataShort,
      liveData,
    };
    postMessage(JSON.stringify(liveDisplayWorkerResult));
    i++;
  }, 1000);
};

//### need to synchronize with system time and clock
// function displayLiveCoordinates(altAzTimeCurveArray) {
//   const dataLength = altAzTimeCurveArray.length;
//   let i = 0;
//   const intervalId = setInterval(() => {
//     if (i === dataLength) {
//       clearInterval(intervalId);
//       return;
//     }
//     const mainClockDate = new Date();

//     // synchronize the usno timestamps with any local machine time
//     // synchronization only expected needed on first pass
//     if (i === 0) {
//       const timestampDateSyncRef = new Date(altAzTimeCurveArray[i].time);
//       const dataDelaySeconds = Math.round(
//         (mainClockDate - timestampDateSyncRef) / 1000
//       );
//       console.log(`Fetch data delay: ${dataDelaySeconds}s`);
//       i += dataDelaySeconds;
//     }
//     const timestampDate = new Date(altAzTimeCurveArray[i].time);
//     const liveData = {
//       dataTimeStamp: timestampDate.toTimeString(),
//       altitude: altAzTimeCurveArray[i].alt,
//       azimuth: altAzTimeCurveArray[i].az,
//     };
//     // ### need to change logic depending on chosen interval size and amount left considering average fetch times. This logic assumes 30 seconds of data supplied at 1 second intervals
//     const isDataShort = i > 20 ? true : false;
//     const liveDisplayWorkerResult = {
//       isDataShort,
//       liveData,
//     };
//     postMessage(JSON.stringify(liveData));
//     i++;
//   }, 1000);
// }

function getAzimuthCardinalDirections(azimuthDegrees) {
  if (
    (azimuthDegrees >= 0 && azimuthDegrees < 22.5) ||
    (azimuthDegrees >= 337.5 && azimuthDegrees <= 360)
  ) {
    return "N";
  } else if (azimuthDegrees >= 22.5 && azimuthDegrees < 67.5) {
    return "NE";
  } else if (azimuthDegrees >= 67.5 && azimuthDegrees < 90) {
    return "E";
  } else if (azimuthDegrees >= 112.5 && azimuthDegrees < 157.5) {
    return "SE";
  } else if (azimuthDegrees >= 157.5 && azimuthDegrees < 202.5) {
    return "S";
  } else if (azimuthDegrees >= 202.5 && azimuthDegrees < 247.5) {
    return "SW";
  } else if (azimuthDegrees >= 247.5 && azimuthDegrees < 292.5) {
    return "W";
  } else if (azimuthDegrees >= 292.5 && azimuthDegrees < 337.5) {
    return "NW";
  }
}

function getAzimuthCardinalDirectionsFine(azimuthDegrees) {
  if (
    (azimuthDegrees >= 0 && azimuthDegrees < 11.25) ||
    (azimuthDegrees >= 348.75 && azimuthDegrees <= 360)
  ) {
    return "N";
  } else if (azimuthDegrees >= 11.25 && azimuthDegrees < 33.75) {
    return "NNE";
  } else if (azimuthDegrees >= 33.75 && azimuthDegrees < 56.25) {
    return "NE";
  } else if (azimuthDegrees >= 56.25 && azimuthDegrees < 78.75) {
    return "ENE";
  } else if (azimuthDegrees >= 78.75 && azimuthDegrees < 101.25) {
    return "E";
  } else if (azimuthDegrees >= 101.25 && azimuthDegrees < 123.75) {
    return "ESE";
  } else if (azimuthDegrees >= 123.75 && azimuthDegrees < 146.25) {
    return "SE";
  } else if (azimuthDegrees >= 146.25 && azimuthDegrees < 168.75) {
    return "SSE";
  } else if (azimuthDegrees >= 168.75 && azimuthDegrees < 191.25) {
    return "S";
  } else if (azimuthDegrees >= 191.25 && azimuthDegrees < 213.75) {
    return "SSW";
  } else if (azimuthDegrees >= 213.75 && azimuthDegrees < 236.25) {
    return "SW";
  } else if (azimuthDegrees >= 236.25 && azimuthDegrees < 258.75) {
    return "WSW";
  } else if (azimuthDegrees >= 258.75 && azimuthDegrees < 281.25) {
    return "W";
  } else if (azimuthDegrees >= 281.25 && azimuthDegrees < 303.75) {
    return "WNW";
  } else if (azimuthDegrees >= 303.75 && azimuthDegrees < 326.25) {
    return "NW";
  } else if (azimuthDegrees >= 326.25 && azimuthDegrees < 348.75) {
    return "NNW";
  }
}
