const testButtonEl = document.getElementById("testButton");

testButtonEl.addEventListener("click", () => {
  getServerData();
});

function getServerData() {
  fetch("http://127.0.0.1:8080/")
    // .then((res) => console.log(res))
    .then((res) => res.text())
    .then((data) => console.log(data))
    .catch((err) => console.log(err));
}
