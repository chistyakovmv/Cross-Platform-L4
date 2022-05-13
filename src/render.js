const videoSelectBtn = document.getElementById("videoSelectBtn");
const videoElement = document.querySelector("video");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const openBtn = document.getElementById("openBtn");
const resetBtn = document.getElementById("resetBtn");

const { writeFile } = require("fs");
const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;

videoSelectBtn.addEventListener('click', () => {
  getVideoSources();
});

let mediaRecorder = null;
const recordedChunks = [];

startBtn.addEventListener('click', () => {
  if (mediaRecorder.state !== 'recording') {
    mediaRecorder.start();
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Запис";
  }
})

stopBtn.addEventListener('click', () => {
  if (mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Почати";
  }
})

openBtn.addEventListener('click', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  resetBtn.style.opacity = "1";
  videoElement.src = filePaths[0];
  videoElement.play();
});

resetBtn.addEventListener('click', () => {
  videoElement.src = "";
  resetBtn.style.opacity = "0";
})

// Captures all recorded chunks
const handleDataAvailable = (e) => {
  console.log("Відео записано!");
  recordedChunks.push(e.data);
}

// Saves the video file on stop
const handleStop = async () => {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  console.log(filePath);

  writeFile(filePath, buffer, () => console.log("Відео збережено!"));
}

const selectSource = async (source) => {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);
  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

const getVideoSources = async () => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => ({
      label: source.name,
      click: () => selectSource(source)
    }))
  );
  videoOptionsMenu.popup();
}