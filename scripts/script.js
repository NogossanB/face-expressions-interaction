async function loadModels() {

  await faceapi.nets.tinyFaceDetector.load("/models");
  await faceapi.nets.faceExpressionNet.load("/models");
  
  console.log("Face API models loaded");
}

loadModels().then(() => {
  startWebcam();
});

const video = document.getElementById("webcam");

async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    video.srcObject = stream;
  } catch (error) {
    console.error("Erreur caméra :", error);
  }
}

import { EMOTIONS } from "./emotions.config.js";



