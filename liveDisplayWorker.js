onmessage = (e) => {
  console.log("live display worker recieved the data!");
  const data = JSON.parse(e.data);
  displayLiveCoordinates(data.altAzTimeCurve);
};

//### need to synchronize with system time and clock
function displayLiveCoordinates(altAzTimeCurveArray) {
  console.log(altAzTimeCurveArray);
  const dataLength = altAzTimeCurveArray.length;
  let i = 0;
  //   clearInterval(mainClockId);
  const intervalId = setInterval(() => {
    if (i === dataLength) {
      clearInterval(intervalId);
      //   runMainClock();
      return;
    }
    const mainClockDate = new Date();
    // clockEl.textContent = mainClockDate.toTimeString();
    const timestampDate = new Date(altAzTimeCurveArray[i].time);
    // ### Need to synchronize the usno timestamps with any local machine time for proper synchronization
    const dataDelaySeconds = Math.round((mainClockDate - timestampDate) / 1000);
    i += dataDelaySeconds;
    const liveData = {
      dataTimeStamp: timestampDate.toTimeString(),
      altitude: altAzTimeCurveArray[i].alt,
      azimuth: altAzTimeCurveArray[i].az,
    };
    postMessage(JSON.stringify(liveData));
    i++;
  }, 1000);
}

function getAzimuthCardinalDirections(azimuthDegrees) {
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
