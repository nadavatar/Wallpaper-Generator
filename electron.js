const electron = require("electron");
const { app, BrowserWindow, ipcMain } = electron;
const wallpaper = require("wallpaper");
const axios = require("axios");
const dotenv = require("dotenv").config();
const fs = require("fs");

let mainWindow;
const apiGateway = "https://api.unsplash.com";
const unsplashKey = process.env.UNSPLASHAPI;

//When The App Starts
app.on("ready", () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadFile("./index.html");
  writeToLog("INFO: Wallpaper Generator Has Started!");
});

//When The App Stops
app.on("quit", async () => {
  writeToLog("INFO: Wallpaper Generator Has Stopped!");
  app.quit();
});

//Write the logs to the log file
const writeToLog = text => {
  const currentDate = new Date();
  fs.appendFile("logs.log", `${currentDate} - ${text} \n`, function(err) {
    if (err) {
      console.log("append failed - " + err);
    } else {
      //done
    }
  });
};

//Download the worf from a url
const downloadImage = async (downloadUrl, imagePath, imageID) => {
  await axios({
    url: downloadUrl,
    responseType: "stream"
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(imagePath))
          .on("finish", () => resolve())
          .on("error", e => reject(e));
      })
  );
  writeToLog(`INFO: Image ${imageID} Qas Downloaded Succefully!`);
  changeWallpaper(imagePath);
  writeToLog("INFO: The Wallpaper Was Succesfully Changed!");
};

//Set the wallpaper to the downloaded image
const changeWallpaper = async imagePath => {
  await wallpaper.set(imagePath);
  await wallpaper.get();

  mainWindow.webContents.send("finishedWallpaper");
};

//Generate a random from a range
const generateRandomNumbers = (min, max) => {
  return Math.random() * (max - min) + min;
};

//Generate a random wallpaper
ipcMain.on("getRandomWallpaper", async event => {
  writeToLog("INFO: Got A Request For A Random Wallpaper");
  const randomApi = `${apiGateway}/photos/random/?client_id=${unsplashKey}`;
  const request = await axios({
    method: "get",
    url: randomApi
  });
  if (request.status === 200) {
    const downloadUrl = request.data.links.download;
    const imageID = request.data.id;
    writeToLog(
      `INFO: Got 200 From The Server For The Random Api Call And The Image Id Is ${imageID}`
    );
    const imagePath = `./images/${imageID}`;
    downloadImage(downloadUrl, imagePath, imageID);
  } else {
    const status = request.status;
    writeToLog(`ERROR: Got ${status} From Server For The Random Api Call`);
  }
});

//Generate a wallpaper by a given word
ipcMain.on("getWallpaperByWord", async (event, word) => {
  writeToLog("INFO: Got A Request For A Wallpaper From A Word");
  const wordApi = `${apiGateway}/search/photos/?client_id=${unsplashKey}&query=${word}`;

  //first we post a request to the api to check the number of pages
  const initialRequest = await axios({
    method: "get",
    url: wordApi
  });
  const numberOfPages = initialRequest.data.total_pages;
  const pageNumber = generateRandomNumbers(1, numberOfPages);

  //The request to get the actual photo
  const request = await axios({
    method: "get",
    url: `${wordApi}&page=${pageNumber}`
  });

  if (request.status === 200) {
    const imageNumber = generateRandomNumbers(0, 9);
    const downloadUrl = request.data.results[0].links.download;
    const imageID = request.data.results[0].id;
    writeToLog(
      `INFO: Got 200 From The Server For The Word Api Call And The Image Id Is ${imageID}`
    );
    const imagePath = `./images/${imageID}`;
    downloadImage(downloadUrl, imagePath, imageID);
  } else {
    const status = request.status;
    writeToLog(`ERROR: Got ${status} From Server For The Word Api Call`);
  }
});
