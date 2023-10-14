// purpose of connections array is to send messages to all connections

const fetchWorker = new Worker("fetchWorker.js");
const liveDisplayWorker = new Worker("liveDisplayWorker");

const connections = [];

// This onmessage will always be from the parent, i.e index.js
onmessage = (e) => {
  switch (e.data.directive) {
    case "startTracking":
      //   console.log(`Message recieved from index`);
      //   console.log("mainWorker calling fetchWorker");
      fetchWorker.postMessage(JSON.stringify(e.data.body));
      break;
  }
};

fetchWorker.onmessage = (e) => {
  //   console.log(`Message from fetchWorker to mainWorker`);
  //   console.log(e.data);
  liveDisplayWorker.postMessage(e.data);
};

liveDisplayWorker.onmessage = (e) => {
  postMessage(e.data);
};
