// purpose of connections array is to send messages to all connections

const fetchWorker = new Worker("fetchWorker.js");
const liveDisplayWorker = new Worker("liveDisplayWorker");

let fetchDataBody = {};
let isFetchingMore = false;

// This onmessage will always be from the parent, i.e index.js
onmessage = (e) => {
  switch (e.data.directive) {
    case "startTracking":
      fetchDataBody = JSON.stringify(e.data.body);
      fetchWorker.postMessage(fetchDataBody);
      break;
  }
};

fetchWorker.onmessage = (e) => {
  isFetchingMore = false;
  liveDisplayWorker.postMessage(e.data);
};

liveDisplayWorker.onmessage = (e) => {
  const liveDisplayWorkerResult = JSON.parse(e.data);
  if (liveDisplayWorkerResult.isDataShort && !isFetchingMore) {
    isFetchingMore = true;
    console.log("data is short, fetching more...");
    fetchWorker.postMessage(fetchDataBody);
  }
  postMessage(JSON.stringify(liveDisplayWorkerResult.liveData));
};
