const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpegCommand = require('fluent-ffmpeg');
ffmpegCommand.setFfmpegPath(ffmpegPath);
const command = new ffmpegCommand();

let timemark = null;

function renderVideo(name, pathToFrames, pathToVideo) {
   command
   .on('end', onEnd )
   .on('progress', onProgress)
   .on('error', onError)
   .addInput(path.join(pathToFrames, `%05d.png`))
      .videoCodec('mpeg4')
      .inputFPS(30)
    .addInput('audio/sinewave-test.mp3')
       .audioCodec('aac')
   .output(pathToVideo + `/${name}.mp4`)
      .outputFPS(30)
      .format('mp4')
      .videoBitrate('1024k')
      .size('1920x1080')
   .frames(80)
   .run();
}

function onProgress(progress){
 if (progress.timemark != timemark) {
 timemark = progress.timemark;
 console.log('Time mark: ' + timemark + "...");
}}

function onError(err, stdout, stderr) {
 console.log('Cannot process video: ' + err.message);
}

function onEnd() {
 console.log('Finished processing');
}

module.exports = renderVideo;