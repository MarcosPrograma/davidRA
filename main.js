import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//iniciar mindAR 
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
        imageTargetSrc: "https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/targets.mind?v=1748745952253",
        filterMinCF: 0.001, //controlar la suavidad: valor bajo > mas suavidad y menos vibración  
        filterBeta: 25, //ajustar como responde el filtro a cambios rapidos: alto valor > respuesta rapida y menos delay 
        warmupTolerance: 8, //espera 8 frames antes de activar el modelo  
        missTolerance: 50, //tolerancia en el que el modelo se mantiene visible cuando se pierde el target 
        
        //uiLoading: "#loading-ui", //controlar la ui 
        //uiScanning: "#scanning-ui",
    });
    
const { renderer, scene, camera } = mindarThree;
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 5);
scene.add(light);

//cargar modelo GLTF
const anchor = mindarThree.addAnchor(0);

let model; 
const loader = new GLTFLoader();
loader.load("https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/david.glb?v=1748919016066",
    (gltf) => {
        model = gltf.scene;
        model.scale.set(0.5, 0.5, 0.5);
        model.rotation.set(THREE.MathUtils.degToRad(90), 0, 0);
        model.position.set(0, 0, 0.1);
        anchor.group.add(model);          
    }
);

//iniciar AR
const start = async () => {
    await mindarThree.start();
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
};

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

start();