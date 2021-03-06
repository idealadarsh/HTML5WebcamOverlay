'use strict';

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

let videoSelect = document.querySelector('select#videoSource');
const startCamBtn = document.querySelector('button#start');
const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
  if (recordButton.textContent === 'Start Recording') {
    startRecording();
  } else {
    stopRecording();
    recordButton.textContent = 'Start Recording';
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
  const superBuffer = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  recordedVideo.src = null;
  recordedVideo.srcObject = null;
  recordedVideo.src = window.URL.createObjectURL(superBuffer);
  recordedVideo.controls = false;
  recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
  const blob = new Blob(recordedBlobs, {
    type: 'video/webm'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});

function handleSourceOpen(event) {
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function startRecording() {
  recordedBlobs = [];
  let options = {
    mimeType: 'video/webm;codecs=vp9'
  };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.error(`${options.mimeType} is not Supported`);
    errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
    options = {
      mimeType: 'video/webm;codecs=vp8'
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.error(`${options.mimeType} is not Supported`);
      errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
      options = {
        mimeType: 'video/webm'
      };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not Supported`);
        errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
        options = {
          mimeType: ''
        };
      }
    }
  }

  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder:', e);
    errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
    return;
  }

  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  recordButton.textContent = 'Stop Recording';
  playButton.disabled = true;
  downloadButton.disabled = true;
  mediaRecorder.onstop = (event) => {
    console.log('Recorder stopped: ', event);
  };
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
}

function stopRecording() {
  mediaRecorder.stop();
}

function handleSuccess(stream) {
  recordButton.disabled = false;
  window.stream = stream;

  const gumVideo = document.querySelector('video#gum');
  gumVideo.srcObject = stream;
}

async function init(constraints) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
  } catch (e) {
    console.error('navigator.getUserMedia error:', e);
    errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
  }
}


startCamBtn.addEventListener('click', async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  for (const device of devices) {
    const option = document.createElement('option');
    option.value = device.deviceId;
    if (device.kind === 'videoinput') {
      option.text = device.label || `Camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }
  const videoSource = videoSelect.value;
  const constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
  startCamBtn.disabled = true;
});

function changeStream(value){
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const videoSource = value;
  const constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined}
  };
  console.log('Using media constraints:', constraints);
  await init(constraints);
}