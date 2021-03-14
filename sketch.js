// ml5 Face Detection Model
let faceapi;
let detections = [];
let dx = 0;
let dy = 0;
let helloRegistered = true;
let square;
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
let poseNet;
var speechRec = new p5.SpeechRec(); // speech recognition object
speechRec.continuous = false; // allow continuous recognition
speechRec.interimResults = true; // allow partial recognition (faster, less accurate)
speechRec.onResult = showResult; // callback function that triggers when speech is recognized
speechRec.onError = showError; // callback function that triggers when an error occurs
speechRec.onEnd = onVoiceRecognitionEnd; // callback function that triggers voice recognition ends

var voice = new p5.Speech(); // speech synthesis object

function setup() {
  square = new Square();
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(width, height);
  faceapi = ml5.faceApi(
    video,
    {
      withLandmarks: true,
      withExpressions: false,
      withDescriptors: false,
    },
    faceReady
  );
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
  image(video, 0, 0, width, height);
  square.draw();
  drawKeypoints();
}

function onVoiceRecognitionEnd() {
  console.log(
    'Voice recognition ended!!!, The message is ' + speechRec.resultString
  );
  if (speechRec.resultString != undefined) {
    if (speechRec.resultString == 'hello') {
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
  console.log('Transcript: ' + speechRec.resultString); // log the transcript
  console.log('Confidence: ' + speechRec.resultConfidence); // log the confidence
}

function showError() {
  console.log('An error occurred!');
}

function faceReady() {
  faceapi.detect(gotFaces);
}

function gotFaces(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  detections = result;
  faceapi.detect(gotFaces);
}

function serialEvent() {
  // read a byte from the serial port:
  let inByte = serial.read();
  // store it in a global variable:
  inData = inByte;
  // console.log(inData);
}

function serialError(err) {
  console.log('Something went wrong with the serial port. ' + err);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  if (detections.length > 0) {
    let points = detections[0].landmarks.positions;
    dx = points[30]._x;
    dy = points[30]._y;
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

  if (oldArdX != ardX || oldArdY != ardY) {
    if (detections.length > 0 && !helloRegistered) {
      // serial.write(high + ',' + ardX + ',' + ardY + '\n');
      console.log(high + ',' + ardX + ',' + ardY + '\n');
      helloRegistered = true;
    } else {
      // serial.write(low + ',' + ardX + ',' + ardY + '\n');
      console.log(low + ',' + ardX + ',' + ardY + '\n');
    }
  }
}

class Square {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
  }

  draw() {
    noStroke();
    rect(this.x, this.y, 40, 40);
  }

  rightWord() {
    fill('green');
  }

  wrongWord() {
    fill('red');
  }
}
