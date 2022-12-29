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
const cameraSettings = { fov: 45, near: 0.1, far: 500 };
const cameraPos = new THREE.Vector3(-16,8,16);
const primaryCamera = new THREE.PerspectiveCamera(cameraSettings.fov,
    window.innerWidth / window.innerHeight, cameraSettings.near, cameraSettings.far);
primaryCamera.position.x = cameraPos.x;
primaryCamera.position.y = cameraPos.y;
primaryCamera.position.z = cameraPos.z;

// ORBIT CAMERA CONTROLS
const orbitControls = new OrbitControls(primaryCamera, renderer.domElement);
orbitControls.mouseButtons = {
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN
}
orbitControls.enableDamping = true
orbitControls.enablePan = false
orbitControls.enableZoom = false
orbitControls.minDistance = 5
orbitControls.maxDistance = 60
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05 // prevent camera below ground
orbitControls.minPolarAngle = Math.PI / 4        // prevent top down view
orbitControls.update();

// RENDER TARGET SECTION
const targetPlaneSize = { width: 6, height: 7};
const targetPlanePosition = { x: -5, y: targetPlaneSize.height / 2, z: 5};
const renderTargetWidth = targetPlaneSize.width * 512;
const renderTargetHeight = targetPlaneSize.height * 512;
const renderTarget = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight);

// SECONDARY CAMERA
const secondaryAspect = renderTargetWidth / renderTargetHeight;
const secondaryCamera = new THREE.PerspectiveCamera(cameraSettings.fov, secondaryAspect, 
    cameraSettings.near, cameraSettings.far);
secondaryCamera.position.x = targetPlanePosition.x;
secondaryCamera.position.y = targetPlanePosition.y + 4;
secondaryCamera.position.z = targetPlanePosition.z;
secondaryCamera.lookAt(new THREE.Vector3(10,5,-10));

// SECONDARY SCENE
const secondaryScene = new THREE.Scene();
secondaryScene.background = new THREE.Color(0xD61C4E);
const secondaryDirectionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
{
    secondaryDirectionalLight.position.set(-10, 10, 10);
    secondaryDirectionalLight.castShadow = true;
    secondaryDirectionalLight.shadow.mapSize.width = 4096;
    secondaryDirectionalLight.shadow.mapSize.height = 4096;
    const d = 35;
    secondaryDirectionalLight.shadow.camera.left = - d;
    secondaryDirectionalLight.shadow.camera.right = d;
    secondaryDirectionalLight.shadow.camera.top = d;
    secondaryDirectionalLight.shadow.camera.bottom = - d;
    secondaryScene.add(secondaryDirectionalLight);

    new GLTFLoader().load('/glb/dark-ground.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
            object.receiveShadow = true;
        });
        secondaryScene.add(gltf.scene);
    });
    new GLTFLoader().load('/glb/dark-objects.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
                object.castShadow = true;
        });
        secondaryScene.add(gltf.scene);
    });
}

// REGULAR SCENE
const primaryScene = new THREE.Scene();
primaryScene.background = new THREE.Color(0xa8def0);
{
    const color = 0xFFFFFF;
    const intensity = 1;
    const direcitonalLight = new THREE.DirectionalLight(color, intensity);
    direcitonalLight.position.set(3, 10, -4);
    direcitonalLight.castShadow = true;
    direcitonalLight.shadow.mapSize.width = 4096;
    direcitonalLight.shadow.mapSize.height = 4096;
    const d = 35;
    direcitonalLight.shadow.camera.left = - d;
    direcitonalLight.shadow.camera.right = d;
    direcitonalLight.shadow.camera.top = d;
    direcitonalLight.shadow.camera.bottom = - d;
    primaryScene.add(direcitonalLight);

    const ambientLight = new THREE.AmbientLight(color, 1);
    primaryScene.add(ambientLight);

    new GLTFLoader().load('/glb/forest-ground.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
            object.receiveShadow = true;
        });
        primaryScene.add(gltf.scene);
    });
    new GLTFLoader().load('/glb/forest-trees.glb', function (gltf: GLTF) {
        gltf.scene.traverse(function (object: THREE.Object3D) {
                object.castShadow = true;
        });
        primaryScene.add(gltf.scene);
    });
}

const material = new THREE.MeshPhongMaterial({
    map: renderTarget.texture,
});
const targetPlane = new THREE.Mesh(new THREE.PlaneGeometry(targetPlaneSize.width, targetPlaneSize.height, 32), material);
targetPlane.rotation.y = -Math.PI / 4

targetPlane.position.y = targetPlanePosition.y;
targetPlane.position.x = targetPlanePosition.x;
targetPlane.position.z = targetPlanePosition.z;

targetPlane.castShadow = true;
primaryScene.add(targetPlane);


// RESIZE HANDLER
function onWindowResize() {
    primaryCamera.aspect = window.innerWidth / window.innerHeight;
    primaryCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

function gameLoop() {
    const time = new Date().getTime();
    secondaryDirectionalLight.position.x = Math.cos(time * 0.002) * 10;
    secondaryDirectionalLight.position.z = Math.sin(time * 0.002) * 10;
    // draw render target scene to render target
    secondaryCamera.rotation.x = primaryCamera.rotation.x;
    secondaryCamera.rotation.y = primaryCamera.rotation.y;
    secondaryCamera.rotation.z = primaryCamera.rotation.z;
    renderer.setRenderTarget(renderTarget);
    renderer.render(secondaryScene, secondaryCamera);
    renderer.setRenderTarget(null);

    orbitControls.update();

    // render the scene to the canvas
    renderer.render(primaryScene, primaryCamera);

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);