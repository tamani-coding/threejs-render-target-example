import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement);

// CAMERA
const camera = new THREE.PerspectiveCamera(45,
    window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = -1;
camera.position.y = 5;
camera.position.z = 20;

// ORBIT CAMERA CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.mouseButtons = {
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN
}
orbitControls.enableDamping = true
orbitControls.enablePan = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 60
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // prevent camera below ground
orbitControls.minPolarAngle = Math.PI / 4        // prevent top down view
orbitControls.update();

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// RENDER TARGET SECTION

const rtWidth = 512;
const rtHeight = 512;
const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

const rtFov = 75;
const rtAspect = rtWidth / rtHeight;
const rtNear = 0.1;
const rtFar = 5;
const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
rtCamera.position.z = 2;

const rtScene = new THREE.Scene();
rtScene.background = new THREE.Color('red');

{
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    rtScene.add(light);
}

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });

    const cube = new THREE.Mesh(geometry, material);
    rtScene.add(cube);

    cube.position.x = x;

    return cube;
}

const rtCubes = [
    makeInstance(geometry, 0x44aa88, 0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844, 2),
];

// REGULAR SCENE
{
    const color = 0xFFFFFF;
    const intensity = 1;
    const direcitonalLight = new THREE.DirectionalLight(color, intensity);
    direcitonalLight.position.set(5, 10, 4);
    direcitonalLight.castShadow = true;
    direcitonalLight.shadow.mapSize.width = 4096;
    direcitonalLight.shadow.mapSize.height = 4096;
    const d = 35;
    direcitonalLight.shadow.camera.left = - d;
    direcitonalLight.shadow.camera.right = d;
    direcitonalLight.shadow.camera.top = d;
    direcitonalLight.shadow.camera.bottom = - d;
    scene.add(direcitonalLight);

    const ambientLight = new THREE.AmbientLight(color, 1);
    scene.add(ambientLight);

    new GLTFLoader().load('/glb/forest-ground.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
            object.receiveShadow = true;
        });
        scene.add(gltf.scene);
    });
    new GLTFLoader().load('/glb/forest-trees.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
                object.castShadow = true;
        });
        scene.add(gltf.scene);
    });
}

const material = new THREE.MeshPhongMaterial({
    map: renderTarget.texture,
});
const cube = new THREE.Mesh(geometry, material);
cube.position.y = 2;
cube.position.x = -4;
cube.castShadow = true;
scene.add(cube);


// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

function gameLoop(time) {
    time *= 0.001;

    // rotate all the cubes in the render target scene
    rtCubes.forEach((cube, ndx) => {
        const speed = 1 + ndx * .1;
        const rot = time * speed;
        cube.rotation.x = rot;
        cube.rotation.y = rot;
    });

    // draw render target scene to render target
    renderer.setRenderTarget(renderTarget);
    renderer.render(rtScene, rtCamera);
    renderer.setRenderTarget(null);

    // rotate the cube in the scene
    cube.rotation.x = time;
    cube.rotation.y = time * 1.1;

    orbitControls.update();

    // render the scene to the canvas
    renderer.render(scene, camera);

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);