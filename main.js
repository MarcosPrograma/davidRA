import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { UIControl } from "./js/ui-control.js";
import { SmoothTracker } from "./js/smooth-tracker.js";
import { screenshotButton } from "./js/capture.js";

const ui = new UIControl();
const tracker = new SmoothTracker();
tracker.setSensitivity('medium');
ui.startLoadingSequence();;

//iniciar mindAR 
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: "src/targets.mind",
    filterMinCF: 0.0001, //controlar la suavidad: valor bajo > mas suavidad y menos vibración  
    filterBeta: 20, //ajustar como responde el filtro a cambios rapidos: alto valor > respuesta rapida y menos delay 
    warmupTolerance: 12, //espera 8 frames antes de activar el modelo  
    missTolerance: 15, //tolerancia en el que el modelo se mantiene visible cuando se pierde el target 
    showStats: false,
    uiLoading: false,
    uiScanning: false,
});

const { renderer, scene, camera } = mindarThree;
scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3));

//cargar modelo GLTF
const anchor = mindarThree.addAnchor(0);
const loader = new GLTFLoader();

let modelGroup = new THREE.Group();
let isTracking = false;

loader.load("src/david.glb", (gltf) => {
    const model = gltf.scene;

    model.scale.set(0.5, 0.5, 0.5);
    model.rotation.set(THREE.MathUtils.degToRad(90), 0, 0);
    model.position.set(0, 0, 0.1);

    model.traverse((child) => {
        if (child.isMesh) {
            child.material.matcap = null;
            child.material.needsUpdate = true;
            child.frustumCulled = false;
        }
    });

    modelGroup.add(model);
    anchor.group.add(modelGroup);

    //inicializar tracking del modelo
    tracker.lastPosition.copy(modelGroup.position);
    tracker.lastRotation.copy(modelGroup.rotation);
    tracker.lastScale.copy(modelGroup.scale);
});

//eventos de tracking
anchor.onTargetFound = () => {
    console.log("Target encontrado");
    isTracking = true;

    // Asegurarse de que la UI original esté oculta
    document.querySelector("#loading-ui")?.classList.add("hidden");
    document.querySelector("#scanning-ui")?.classList.add("hidden");
    tracker.onTargetFound();
    ui.onTargetFound();
};

anchor.onTargetLost = () => {
    console.log("Target perdido");
    isTracking = false;

    // Mantener la UI original oculta
    document.querySelector("#loading-ui")?.classList.add("hidden");
    document.querySelector("#scanning-ui")?.classList.add("hidden");
    tracker.onTargetLost();
    ui.onTargetLost();
};

//agregar controles para ajustar sensibilidad dinámicamente
window.setSensitivity = (level) => {
    tracker.setSensitivity(level);
    console.log(`Sensibilidad cambiada a: ${level}`);
};

screenshotButton(renderer, scene, camera);

//iniciar AR
const start = async () => {
  await mindarThree.start();
  ui.onARReady();

  renderer.setAnimationLoop(() => {
    tracker.smoothTransform(modelGroup, anchor.group);
    renderer.render(scene, camera);
  });
};

start();