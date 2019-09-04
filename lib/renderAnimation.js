
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const globals = {};

let endTime, startTime, totalTime, frameRenderTime = null;

const renderAnimation = (flagResize, sceneObjects, finalWidth, finalHeight, numFrames, pathToScaledFrames, pathToFinalFrames, pathToData) => {

    globals.scene = sceneObjects.scene;
    globals.camera = sceneObjects.camera;
    globals.renderer = sceneObjects.renderer;
    globals.frustrum = sceneObjects.frustrum;
    globals.finalWidth = finalWidth;
    globals.finalHeight = finalHeight;
    globals.numFrames = numFrames;
    globals.flagResize = flagResize;
    globals.pathToScaledFrames = pathToScaledFrames;
    globals.pathToFinalFrames = pathToFinalFrames;
    globals.windowData = JSON.parse(fs.readFileSync(pathToData));

    return new Promise((resolve, reject) => {
        startTime = Date.now();
        if(render(1)) {
            resolve();
        } else {
            reject();
        };
    })

}

function render(currentFrame) {

    //const frame = !currentFrame ? 1 : currentFrame;

    if (currentFrame > globals.numFrames) {
        return true;
        // endTime = Date.now();
        // totalTime = (endTime-startTime);
        // frameRenderTime = totalTime/frame;
        // console.log(`Render complete: \n
        //     Total Time: ${totalTime} \n
        //     # Frames: ${frame-1} \n
        //     Frame Render Time: ${frameRenderTime.toPrecision(6)} \n
        //     Est. Time to Render a 4 Minute Song @ 48 FPS: ${(frameRenderTime*48*240)/(60*1000).toPrecision(4)} minutes (${(frameRenderTime*48*180)/(60*60*1000).toPrecision(4)} hours) \n
        //     Est. Time to Render a 4 Minute Song @ 30 FPS: ${(frameRenderTime*30*240)/(60*1000).toPrecision(4)} minutes (${(frameRenderTime*30*180)/(60*60*1000).toPrecision(4)} hours)
        // `);
    } else {

        // Render the current frame
        globals.renderer.render(globals.scene, globals.camera);

        // Capture the frame
        const frameFormatted = currentFrame.toString().padStart(5,'0');
        let scaledFramePath = path.join(globals.pathToScaledFrames, `${frameFormatted}.png`);
        let framePath = path.join(globals.pathToFinalFrames,`${frameFormatted}.png`);

        let out = fs.createWriteStream(scaledFramePath);
        var canvasStream = globals.renderer.domElement.pngStream();
        canvasStream.on("data", function (chunk) { out.write(chunk); });
        canvasStream.on("end", function () {
            console.log(`Wrote frame ${currentFrame}`);
            fs.exists(scaledFramePath, () => {
                if(globals.flagResize) {
                    sharp(scaledFramePath)
                        .resize(globals.finalWidth, globals.finalHeight)
                        .toFile(framePath, (err) => {
                            if(err) {
                                console.log(`Error resizing frame ${currentFrame}: ${err}`);
                                return false;
                            } else {
                                console.log(`Resized frame ${currentFrame}`);
                                animate(currentFrame);
                            }
                        });
                } else {
                    animate(currentFrame);
                }
            });
        });
    }
}

function animate(frame){

    const points = globals.scene.getObjectByName('points');
    const window = globals.windowData[frame - 1].data;
    const prevPoints = points.geometry.attributes.position.array;
    
    let prevWindow;
    
    if(frame !== 1) {
        prevWindow = globals.windowData[frame - 2].data;
    }

    console.log(window.length);

    for(let i = 0; i < window.length; i++) {

        let pointHeight;

        if(!!prevWindow) {
            if(window[i] < prevWindow[i]) {
                pointHeight = prevPoints[i * 3 + 1] * 0.95;
            } else {
                pointHeight = globals.frustrum/4 * window[i]/255;
            }
        }

        points.geometry.attributes.position.array[i * 3 + 1] = pointHeight;

    }

    points.geometry.needsUpdate = true;

    // Go to next frame
    frame++;
    render(frame);
}

module.exports = renderAnimation;