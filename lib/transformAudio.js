const decode = require('audio-decode');
const fs = require('fs');
// const fft = require('fourier-transform');
const fft = require('fft-js').fft;
const fftUtil = require('fft-js').util;
// const fft = require('ndarray-fft');
// const ndarray = require('ndarray');
// const mag = require('ndarray-complex').mag;

const blackmanHarris = require('window-function/blackman-harris');
const applyWindow = require('window-function/apply');
const db = require('decibels');

const transformAudio = (audioSourcePath, dataWritePath, fftSize, fps, minDb, maxDb, numFrames) => {

    return new Promise((resolve, reject) => {

        const audio = fs.readFileSync(audioSourcePath);
        decode(audio).then(audioBuffer => {

            const audioMetaData = {
                channels: audioBuffer.numberOfChannels,
                channelLength: audioBuffer.length,
                sampleRate: audioBuffer.sampleRate,
                duration: audioBuffer.duration,
                windowLength: audioBuffer.sampleRate/fps
            };

            // TODO: is there a method for getting these?
            const audioBufferLeft = audioBuffer._channelData[0];
            const audioBufferRight = audioBuffer._channelData[1];

            const audioBufferMono = downMixSignal(audioBufferLeft, audioBufferRight);
            const windowData = splitByWindow(audioBufferMono, audioMetaData.windowLength, fftSize, numFrames);

            const outputData = windowData.map((window) => {
                const windowedData = applyWindowingFunction(window.data, blackmanHarris);
                const fftData = applyFourierTransform(windowedData, fftSize);
                const dbData = gainToDecibels(fftData);
                const normalDbData = normalizeDecibels(dbData, minDb, maxDb);
                return {
                    ...window,
                    data: normalDbData
                };
            })

            const smoothOutputData = applySmoothingFunction(outputData, 0.8);
            console.log(smoothOutputData[0].data.length);

            fs.writeFileSync(dataWritePath, JSON.stringify(smoothOutputData));

            resolve()

        }).catch((err) => {
            console.error(`error transforming audio data ${err}`);
            reject(err);
        });

    })

}

// downmix
function downMixSignal(audioBufferLeft, audioBufferRight) {
    
    const audioBufferMono = [];

    for (let i = 0; i < audioBufferLeft.length; i++) {
        audioBufferMono[i] = audioBufferLeft[i] + audioBufferRight[i] / 2;
    }

    return audioBufferMono

}

function splitByWindow(audioBuffer, windowLength, fftSize, numFrames) {

    const windowData = [];

    for(let i = 0; i < numFrames; i++) {

        const zeroPaddedArray = new Array(fftSize).fill(0);
        const windowStart = i * windowLength;
        const windowEnd = i * windowLength + windowLength;
        const window = audioBuffer.slice(windowStart, windowEnd);
        zeroPaddedArray.splice(0, windowLength, ...window);

        windowData.push({
            windowStart,
            data: zeroPaddedArray
        })

    }

    return windowData;

}

function applyWindowingFunction(data, windowingFunction) {
    const windowedData = applyWindow(data, windowingFunction);
    return windowedData;
}

function applyFourierTransform(data, fftSize) {

    var complexCoef = fft(data); //This includes coefficients for the negative frequencies, and the Nyquist frequency.
    var magnitudes = fftUtil.fftMag(complexCoef);
    //var frequencies = fftUtil.fftFreq(complexCoef, 44100);

    console.log(data.length);

    return magnitudes;

    //const array = new Float32Array(data);

    // const reals = ndarray(data, [ data.length, 1 ]);
    // const imags = ndarray(new Float32Array(data.length), [ data.length, 1 ]);

    // fft(1, reals, imags);
    // mag(reals, reals, imags);
    // return reals.data.slice(0, reals.data.length / 2);

    //return magnitudes.map((mag) => mag/fftSize);
}

function gainToDecibels(data) {
    const dbArray = data.map(el => db.fromGain(el));
    return dbArray;
}

function normalizeDecibels(data, minDb, maxDb) {
    
    const rangeScaleFactor = maxDb === minDb ? 1 : 1 / (maxDb - minDb);

    const normalizedData = data.map((el) => {
        const magnitude = Math.max(el, minDb);
        const scaledValue = 255 * (magnitude - minDb) * rangeScaleFactor;
        return scaledValue;
    });

    return normalizedData;

}

function applySmoothingFunction(data, smoothingConstant) {

    let smoothData = [];

    for(let i = 0; i < data.length; i++) {

        const currentFrame = data[i].data;

        if(i !== 0 ) {

            const prevFrame = smoothData[i-1].data;
            const smoothDataFrame = currentFrame.map((el, j) => {
                return smoothingConstant * prevFrame[j] + (1 - smoothingConstant) * el;
            });

            smoothData.push({
                windowStart: data[i].windowStart,
                data: smoothDataFrame
            })

        } else if(i === 0) {

            const smoothDataFrame = currentFrame.map((el) => {
                return (1 - smoothingConstant) * el;
            });

            smoothData.push({
                windowStart: data[i].windowStart,
                data: smoothDataFrame
            });

        }

    }

    return smoothData;

}

module.exports = transformAudio;