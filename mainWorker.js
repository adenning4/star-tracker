// purpose of connections array is to send messages to all connections

const fetchWorker = new Worker("fetchWorker.js");
const liveDisplayWorker = new Worker("liveDisplayWorker");

let fetchDataBody = {};
let isFetchingMore = false;
let fetchCount = null;

// This onmessage will always be from the parent, i.e index.js
onmessage = (e) => {
  const indexMessage = JSON.parse(e.data);
  switch (indexMessage.directive) {
    case "startTracking":
      if (fetchCount < 45) {
        fetchDataBody = indexMessage.body;
        fetchWorker.postMessage(JSON.stringify(fetchDataBody));
      } else {
        console.log(`fetch count too high: ${fetchCount}`);
      }
      break;
    case "updateFetchCount":
      fetchCount = indexMessage.body;
      console.log(fetchCount);
  }
};

fetchWorker.onmessage = (e) => {
  const mainMessage = {
    directive: "addFetchCount",
    body: null,
  };
  postMessage(JSON.stringify(mainMessage));
  isFetchingMore = false;
  liveDisplayWorker.postMessage(e.data);
};

liveDisplayWorker.onmessage = (e) => {
  const liveDisplayWorkerResult = JSON.parse(e.data);
  if (liveDisplayWorkerResult.isDataShort && !isFetchingMore) {
    isFetchingMore = true;
    console.log("data is short, fetching more...");
    if (fetchCount < 45) {
      fetchWorker.postMessage(JSON.stringify(fetchDataBody));
    } else {
      console.log(`fetch count too high: ${fetchCount}`);
    }
  }
  const mainMessage = {
    directive: "displayLiveData",
    body: liveDisplayWorkerResult.liveData,
  };
  // postMessage(JSON.stringify(liveDisplayWorkerResult.liveData));
  postMessage(JSON.stringify(mainMessage));
};
