const testButtonEl = document.getElementById("testButton");
const fetchStatusEl = document.getElementById("fetchStatus");

testButtonEl.addEventListener("click", () => {
  getServerData();
});

function getServerData() {
  fetch("http://127.0.0.1:8080/test1")
    // .then((res) => console.log(res))
    .then((res) => {
      fetchStatusEl.textContent = res.status;
      return res.json();
    })
    .then((data) => console.log(data))
    .catch((err) => (fetchStatusEl.textContent = err));
}
