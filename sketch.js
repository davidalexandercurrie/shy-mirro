// ml5 Face Detection Model
let faceapi;
let detections = [];
let dx = 0;
let dy = 0;
let helloRegistered = false;
let square;
let square2;
let serial;
let portName = '/dev/tty.usbmodem14641';
let inData;
let outByte = 0;
let video;
let timestamp = 0;
let capture;
let high = 1;
let low = 0;
let posX = 0;
let posY = 0;
let oldX = 0;
let oldY = 0;
let ardX = 0;
let ardY = 0;
let oldArdX = 0;
let oldArdY = 0;
let poses = [];
let isPerson = false;
let speechRec = new p5.SpeechRec(); // speech recognition object
speechRec.continuous = false; // allow continuous recognition
speechRec.interimResults = true; // allow partial recognition (faster, less accurate)
speechRec.onResult = showResult; // callback function that triggers when speech is recognized
speechRec.onError = showError; // callback function that triggers when an error occurs
speechRec.onEnd = onVoiceRecognitionEnd; // callback function that triggers voice recognition ends

let voice = new p5.Speech(); // speech synthesis object

function setup() {
  square = new Square(100, 100);
  square2 = new Square(300, 100);
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(width, height);

  // const detectionOptions = {
  //   withLandmarks: true,
  //   withDescriptors: false,
  // };
  // faceapi = ml5.faceApi(video, detectionOptions, faceReady);
  // Create a new poseNet method
  const poseNet = ml5.poseNet(video, modelLoaded);

  // When the model is loaded
  function modelLoaded() {
    console.log('Model Loaded!');
  }
  // Listen to new 'pose' events
  poseNet.on('pose', function (results) {
    poses = results;
  });
  video.hide();

  serial = new p5.SerialPort(); // make a new instance of the serialport library
  serial.on('data', serialEvent); // callback for when new data arrives
  serial.on('error', serialError); // callback for errors
  serial.open(portName);

  posX = width / 2;
  posY = height / 2;

  getAudioContext().suspend();
}

function draw() {
  frameRate(10);
  image(video, 0, 0, width, height);
  square.draw();
  square2.draw();
  drawKeypoints();
}

function onVoiceRecognitionEnd() {
  console.log(
    'Voice recognition ended!!!, The message is ' + speechRec.resultString
  );
  if (speechRec.resultString != undefined) {
    if (speechRec.resultString.includes('hello')) {
      square.rightWord();
      helloRegistered = false;
    } else {
      square.wrongWord();
    }
    voice.speak(speechRec.resultString);
  }
  listen();
}

function listen() {
  speechRec.start(); // start listening
  console.log("I'm listening...");
}

function showResult() {
  // console.log('Transcript: ' + speechRec.resultString); // log the transcript
  // console.log('Confidence: ' + speechRec.resultConfidence); // log the confidence
}

function showError() {
  console.log('An error occurred!');
}

// function faceReady() {
//   faceapi.detect(gotFaces);
// }

// function gotFaces(error, result) {
//   if (error) {
//     console.log('error' + error);
//     return;
//   }
//   detections = result;
//   faceapi.detect(gotFaces);
// }

function serialEvent() {
  // read a byte from the serial port:
  let inByte = serial.read();
  // store it in a global variable:
  inData = inByte;
}

function serialError(err) {
  console.log('Something went wrong with the serial port. ' + err);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  if (poses.length > 0) {
    if (poses[0].pose.nose != undefined) {
      square2.rightWord();
      isPerson = true;
    }
    dx = poses[0].pose.nose.x;
    dy = poses[0].pose.nose.y;
  } else {
    isPerson = false;
    square2.wrongWord();
  }
  oldX = posX;
  oldY = posY;
  //map posX & posY to new variables for Arduino
  posX += (dx - oldX) * 0.08; //was 0.1
  posY += (dy - oldY) * 0.08;

  //send to Arduino
  oldArdX = ardX;
  oldArdY = ardY;
  ardX = int(map(posY, 0, width, 0, 50));
  ardY = int(map(posX, 0, height, 50, 0));

  //fill('teal');
  stroke('red');
  strokeWeight(2);
  ellipse(posX, posY, 30, 30);

  serial.write(
    `${isPerson ? high : low},${
      !helloRegistered ? high : low
    },${ardX},${ardY}\n`
  );
  console.log(
    `${isPerson ? high : low},${
      !helloRegistered ? high : low
    },${ardX},${ardY}\n`
  );
  helloRegistered = true;
}

class Square {
  constructor(w, h) {
    this.x = w;
    this.y = h;
    this.fill = 'white';
  }

  draw() {
    fill(this.fill);
    noStroke();
    rect(this.x, this.y, 40, 40);
  }

  rightWord() {
    this.fill = 'green';
  }

  wrongWord() {
    this.fill = 'red';
  }
}
