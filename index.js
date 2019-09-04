
// app modules
const initScene = require('./lib/initScene');
const transformAudio = require('./lib/transformAudio');
const renderAnimation = require('./lib/renderAnimation');
const renderVideo = require('./lib/renderVideo');

// three.js
global.THREE = require('three');
require('three/examples/js/renderers/Projector');
require('three/examples/js/renderers/SoftwareRenderer.js');

// npm modules
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// constants`
const fftSize = 2048;
const width = 1920;
const height = 1080;
const frustrum = fftSize / 4;
const scaleFactor = 1;
const name = 'visualizer-test';
const fps = 30;
const numFrames = 80;
const minDb = -120;
const maxDb = 0;

// paths
const pathToScaledFrames = path.join(__dirname, 'frames', 'scaled');
const pathToFinalFrames = path.join(__dirname, 'frames', 'final');
const pathToVideo = path.join(__dirname, 'video');
const pathToData = path.join(__dirname, 'data', `${name}.json`);
const pathToAudio = path.join(__dirname, 'audio', 'sinewave-test.mp3');

//renderVideo(name, pathToScaledFrames, pathToVideo);
//transformAudio(pathToAudio, pathToData, fftSize, fps, minDb, maxDb, numFrames);

Promise.all([
    transformAudio(pathToAudio, pathToData, fftSize, fps, minDb, maxDb, numFrames),
    initScene(width * scaleFactor, height * scaleFactor, fftSize, frustrum)
]).then((values) => {
    const sceneObjects = values[1]
    renderAnimation(false, {
        ...sceneObjects,
        frustrum
    }, width, height, numFrames, pathToScaledFrames, pathToFinalFrames, pathToData)
        .then(() => {
            renderVideo(name, pathToScaledFrames, pathToVideo);
            console.log('successfully rendered animation');
        }).catch((err) => {
            console.error('error rendering animation: ' + err);
        });
}).catch((err) => {
    console.error(`application error: ${err}`);
});