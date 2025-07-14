import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
      
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
        imageTargetSrc: "https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/targets.mind?v=1748745952253",
        filterMinCF: 0.0001,
        filterBeta: 1000,
        warmupTolerance: 5,
        missTolerance: 5,
    });

const { renderer, scene, camera } = mindarThree;

const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 5);
scene.add(light);

// Cargar modelo GLTF
const anchor = mindarThree.addAnchor(0);
const loader = new GLTFLoader();
loader.load("https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/david.glb?v=1748919016066",
    (gltf) => {
        const model = gltf.scene;
        model.scale.set(0.25, 0.25, 0.25);
        model.rotation.set(THREE.MathUtils.degToRad(90), 0, 0);
        model.position.set(0, 0, 0.1);
        anchor.group.add(model);      
    }
);

// Iniciar AR
const start = async () => {
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
};

start();
