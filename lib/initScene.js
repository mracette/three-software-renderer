global.THREE = require('three');
require('three/examples/js/renderers/Projector');
require('three/examples/js/renderers/SoftwareRenderer.js');
const npmCanvas = require('canvas');

const initScene = (width, height, fftSize, frustrum) => {

    return new Promise((resolve, reject) => {

        try {

        /* canvas */
        const canvas = new npmCanvas.Canvas()

        /* scene init */
        const scene = new THREE.Scene();

        /* renderer init */
        const renderer = new THREE.SoftwareRenderer({
            alpha: true,
            canvas: canvas
        })

        renderer.setSize(width, height);
        renderer.setClearColor(0xffffff, 1);

        /* camera init */
        const aspect = width / height
        const camera = new THREE.OrthographicCamera(-frustrum, frustrum, frustrum/aspect, -frustrum/aspect, .01, 1000);
        camera.position.set(0,0,50);

        /* objects init */
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.PointsMaterial( 0x0000ff );
        const numPoints = fftSize / 2;
        const positions = new Float32Array(numPoints * 3);
        const expParams = solveExpEquation(1, 1, numPoints + 1, numPoints * 2 + 1);
        console.log(expParams);

        for(let i = 0; i < numPoints; i++) {
            // positions[i * 3] = - frustrum + expParams.a * Math.pow(expParams.b, i);
            positions[i * 3] = - frustrum + (frustrum * 2) * (i / numPoints);
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
        }

        geo.addAttribute('position', new THREE.BufferAttribute(positions, 3));

        const points = new THREE.Points(geo, mat);
        points.name = 'points';

        scene.add(points);

        resolve({scene, camera, renderer});

        } catch(err) {

            reject(err);

        }

    })

}

const solveExpEquation = (x0, y0, x1, y1) => {

    // solve the system of equations ...
    // a*b^(x0) = y0
    // a*b^(x1) = y1

    const b = Math.pow((y1/y0), (1/(x1-x0)));
    const a = y0/Math.pow(b, x0);
    return {a, b}; // to be used y = ab^x
}

module.exports = initScene;