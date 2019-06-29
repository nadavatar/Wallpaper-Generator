const electron = require("electron");
const { ipcRenderer } = electron;

const randomButton = document.getElementById("randomBtn");
randomButton.addEventListener("click", e => {
  ipcRenderer.send("getRandomWallpaper");

  const randomStatusContainer = document.getElementById(
    "randomStatusContainer"
  );
  randomStatusContainer.innerHTML =
    "<p>Wait while we prepare your desktop...<p/>";

  ipcRenderer.on("finishedWallpaper", () => {
    alert("Your wallpaper has changed!");
    randomStatusContainer.innerHTML = "";
  });
});

const input = document.getElementById("search");
const submitButton = document.getElementById("submitBtn");
submitButton.addEventListener("click", e => {
  e.preventDefault();
  const word = input.value;
  ipcRenderer.send("getWallpaperByWord", word);

  const wordStatusContainer = document.getElementById("wordStatusContainer");
  wordStatusContainer.innerHTML =
    "<p>Wait while we prepare your desktop...</p>";

  ipcRenderer.on("finishedWallpaper", () => {
    alert("Your wallpaper has changed!");
    wordStatusContainer.innerHTML = "";
  });
  input.value = "";
});
