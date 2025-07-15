import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//iniciar mindAR 
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
        imageTargetSrc: "https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/targets.mind?v=1748745952253",
        filterMinCF: 0.0001, //controlar la suavidad: valor bajo > mas suavidad y menos vibración  
        filterBeta: 25, //ajustar como responde el filtro a cambios rapidos: alto valor > respuesta rapida y menos delay 
        warmupTolerance: 8, //espera 8 frames antes de activar el modelo  
        missTolerance: 50, //tolerancia en el que el modelo se mantiene visible cuando se pierde el target 
        showStats: false

        //uiLoading: "#loading-ui", //controlar la ui 
        //uiScanning: "#scanning-ui",
    });
    
const { renderer, scene, camera } = mindarThree;
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
scene.add(light);

let lastPosition = new THREE.Vector3();
let lastRotation = new THREE.Euler();
let lastScale = new THREE.Vector3(1, 1, 1);
const smoothingFactor = 0.15; //ajustar entre 0.05 (muy suave) y 0.3 (más responsivo)
let isTracking = false;
let frameCount = 0;
const stabilizationFrames = 10; //frames adicionales para estabilizar

//cargar modelo GLTF
const anchor = mindarThree.addAnchor(0);
let model; 
let modelGroup;

const loader = new GLTFLoader();
loader.load("https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/david.glb?v=1748919016066",
    (gltf) => {
        model = gltf.scene;

        //crear un grupo contenedor para mejor control
        modelGroup = new THREE.Group();
        modelGroup.add(model);

        model.scale.set(0.5, 0.5, 0.5);
        model.rotation.set(THREE.MathUtils.degToRad(90), 0, 0);
        model.position.set(0, 0, 0.1);

        //optimizar materiales para mejor rendimiento
        model.traverse((child) => {
            if (child.isMesh) {
                child.material.matcap = null;
                child.material.needsUpdate = true;
                child.frustumCulled = false; // Evitar culling que puede causar flickering
            }
        });

        anchor.group.add(model);     

        //inicializar posiciones para el suavizado
        lastPosition.copy(modelGroup.position);
        lastRotation.copy(modelGroup.rotation);
        lastScale.copy(modelGroup.scale);     
    }
);

//eventos de tracking
anchor.onTargetFound = () => {
    console.log("Target encontrado");
    isTracking = true;
    frameCount = 0;
};

anchor.onTargetLost = () => {
    console.log("Target perdido");
    isTracking = false;
};

//suavizar
function smoothTransform() {
    if (!modelGroup || !isTracking) return;
    
    frameCount++;
    
    //aplicar suavizado después de los frames de estabilización
    if (frameCount > stabilizationFrames) {
        const anchorPos = anchor.group.position;
        const anchorRot = anchor.group.rotation;
        const anchorScale = anchor.group.scale;
        
        //suavizar posición
        lastPosition.lerp(anchorPos, smoothingFactor);
        modelGroup.position.copy(lastPosition);
        
        //suavizar rotación
        lastRotation.x += (anchorRot.x - lastRotation.x) * smoothingFactor;
        lastRotation.y += (anchorRot.y - lastRotation.y) * smoothingFactor;
        lastRotation.z += (anchorRot.z - lastRotation.z) * smoothingFactor;
        modelGroup.rotation.copy(lastRotation);
        
        //savizar escala
        lastScale.lerp(anchorScale, smoothingFactor);
        modelGroup.scale.copy(lastScale);
    }
}

//tomar foto
document.getElementById("botonCaptura").addEventListener("click", async () => {
  const video = document.querySelector("video");
  if (!video) {
    alert("No se encontró el video de la cámara");
    return;
  }

  //forzar renderizado manual antes de captura, por si AnimationLoop termino
  renderer.render(scene, camera);

  //esperar un frame
  await new Promise((resolve) => requestAnimationFrame(resolve));

  const width = renderer.domElement.width;
  const height = renderer.domElement.height;
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = width;
  finalCanvas.height = height;

  const ctx = finalCanvas.getContext("2d");

  //dibujar el video de fondo
  ctx.drawImage(video, 0, 0, width, height);

  //dibujar el canvas de WebGL con el modelo 3D renderizado
  ctx.drawImage(renderer.domElement, 0, 0, width, height);

  //descargar
  finalCanvas.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "captura-ar.png";
    link.click();
  }, "image/png");
});

//iniciar AR
const start = async () => {
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
        smoothTransform();
        renderer.render(scene, camera);
    });
};

start();