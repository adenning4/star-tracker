// purpose of connections array is to send messages to all connections

const fetchWorker = new Worker("fetchWorker.js");
const liveDisplayWorker = new Worker("liveDisplayWorker");

let fetchDataBody = {};
let isFetchingMore = false;
let serverlessFetchCount = null;
const maxFetchCount = 100000;

// This onmessage will always be from the parent, i.e index.js
onmessage = (e) => {
  const messageFromIndex = JSON.parse(e.data);
  switch (messageFromIndex.directive) {
    case "startTracking":
      serverlessFetchCount = messageFromIndex.body.fetchCount;
      if (serverlessFetchCount < maxFetchCount) {
        fetchDataBody = messageFromIndex.body;
        const messageToFetchWorker = {
          directive: "serverlessFetch",
          body: fetchDataBody,
        };
        fetchWorker.postMessage(JSON.stringify(messageToFetchWorker));
      } else {
        console.log(`fetch count too high: ${serverlessFetchCount}`);
        const messageToFetchWorker = {
          directive: "proxyFetch",
          body: fetchDataBody,
        };
        fetchWorker.postMessage(JSON.stringify(messageToFetchWorker));
      }
      break;

    case "updateFetchCount":
      serverlessFetchCount = messageFromIndex.body;
      console.log(serverlessFetchCount);
  }
};

fetchWorker.onmessage = (e) => {
  const messageFromFetchWorker = JSON.parse(e.data);

  switch (messageFromFetchWorker.directive) {
    case "useUpdatedData":
      isFetchingMore = false;

      const messageToIndex = {
        directive: "addFetchCount",
        body: null,
      };
      postMessage(JSON.stringify(messageToIndex));

      const messageToLiveDisplayWorker = {
        directive: "synchronizeDataArray",
        body: messageFromFetchWorker.body,
      };
      liveDisplayWorker.postMessage(JSON.stringify(messageToLiveDisplayWorker));

      break;

    case "notifyFetchError":
      throw "fetchWorker Error";
      break;
  }
};

liveDisplayWorker.onmessage = (e) => {
  const messageFromLiveDisplayWorker = JSON.parse(e.data);

  switch (messageFromLiveDisplayWorker.directive) {
    case "displayLiveData":
      const messageToIndex = {
        directive: "displayLiveData",
        body: messageFromLiveDisplayWorker.body,
      };
      postMessage(JSON.stringify(messageToIndex));

      break;

    case "fetchMoreData":
      if (!isFetchingMore) {
        isFetchingMore = true;
        if (serverlessFetchCount < maxFetchCount) {
          const messageToFetchWorker = {
            directive: "serverlessFetch",
            body: fetchDataBody,
          };
          fetchWorker.postMessage(JSON.stringify(messageToFetchWorker));
        } else {
          console.log(`fetch count too high: ${serverlessFetchCount}`);
          throw "fetch count too high!";
        }
      }

      break;
  }
};

fetchWorker.onerror = (e) => {
  console.log("fetchWorker error:");
  console.log(e.data);
  throw "fetchWorker Error";
};
liveDisplayWorker.onerror = (e) => {
  console.log("liveDisplayWorker error:");
  console.log(e.data);
  throw "liveDisplayWorker Error";
};
