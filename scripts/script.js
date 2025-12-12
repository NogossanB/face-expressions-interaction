import { EMOTIONS } from "./emotions.config.js";

let experienceStarted = false;

let currentEmotion = null;
let pendingEmotion = null;       
let stabilityCount = 0;
let lastChangeTime = 0;

const STABILITY_REQUIRED = 3;   
const COOLDOWN = 500; 

// Event bouton

document.getElementById("start-experience").addEventListener("click", () => {
  experienceStarted = true;

  document.getElementById("start-experience").style.display = "none";
  console.log("Expérience démarrée !");
});



console.log("Script en chargement");

// Charger les modèles FaceAPI
async function loadModels() {
  await faceapi.nets.tinyFaceDetector.load("./models");
  await faceapi.nets.faceExpressionNet.load("./models");
  console.log("Face API models loaded");
}

const video = document.getElementById("webcam"); // ✔ correct
let options = new faceapi.TinyFaceDetectorOptions({ inputSize: 256 });

// Webcam start
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      console.log("Webcam OK → lancement détection");
      detectLoop();
    };
  } catch (error) {
    console.error("Erreur caméra :", error);
  }
}



// Choisit l’émotion face-api la plus forte
function getDominantEmotion(expressions) {

  const happy = expressions.happy;
  const sad = expressions.sad;
  const neutral = expressions.neutral;

  // JOY 
  if (happy > 0.35) {
    return "happy";
  }

  // JOY = visage neutre mais légèrement positif
  if (neutral > 0.50 && happy > 0.20) {
    return "happy";
  }

  // TENSION DOUCE
  if (sad > 0.20) {
    return "sad";
  }

  // NEUTRE 
  return "sad";
}


function mapToCustomEmotion(faceEmotion) {
  if (faceEmotion === "happy") return EMOTIONS.joy;
  if (faceEmotion === "sad") return EMOTIONS.tension; 

  // Neutre → Tension douce 
  return EMOTIONS.tension;
}




// Appliquer les émotions
function applyEmotion(emotion) {
  if (!emotion) return; 

  document.body.style.background =
    `linear-gradient(135deg, ${emotion.bg1}, ${emotion.bg2})`;

  const container = document.getElementById("symbols-container");
  container.innerHTML = ""; 

  emotion.symbols.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "symbol";

    img.style.position = "absolute";
    img.style.top = "85%"; 
    img.style.left = (30 + i * 20) + "%";
    img.style.transform = "translate(-50%, -50%)";

    

    container.appendChild(img);
  });
}



// Boucle de détection
async function detectLoop() {

    const result = await faceapi
      .detectSingleFace(video, options)
      .withFaceExpressions();

    if (result && result.expressions) {

        const dom = getDominantEmotion(result.expressions);
        const emo = mapToCustomEmotion(dom);

        // Transition

        if (emo.label !== pendingEmotion) {
            pendingEmotion = emo.label;
            stabilityCount = 0;
        } else {
            stabilityCount++;
        }

        if (stabilityCount < STABILITY_REQUIRED) {
            requestAnimationFrame(detectLoop);
            return;
        }

        const now = Date.now();
        if (now - lastChangeTime < COOLDOWN) {
            requestAnimationFrame(detectLoop);
            return;
        }

        if (!experienceStarted) {
            requestAnimationFrame(detectLoop);
            return;
        }


        if (pendingEmotion !== currentEmotion) {

            currentEmotion = pendingEmotion;
            lastChangeTime = now;

            applyEmotion(emo);
            applyAuraCenter(emo);

            console.log("Transition vers :", emo.label);
        }
    }

    requestAnimationFrame(detectLoop);
}


function applyAuraCenter(emotion) {
  const aura = document.getElementById("emotion-aura");

  aura.style.background = `
    radial-gradient(
      circle at 50% 50%,
      ${emotion.color1}44 0%,
      ${emotion.color2}33 35%,
      transparent 80%
    )
  `;
}

detectLoop();

// Lancement global
loadModels().then(() => startWebcam());
