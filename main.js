import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//iniciar mindAR 
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
        imageTargetSrc: "https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/targets.mind?v=1748745952253",
        filterMinCF: 0.05, //controlar la suavidad: valor bajo > mas suavidad y menos vibración  
        filterBeta: 10, //ajustar como responde el filtro a cambios rapidos: alto valor > respuesta rapida y menos delay 
        warmupTolerance: 8, //espera 8 frames antes de activar el modelo  
        missTolerance: 50, //tolerancia en el que el modelo se mantiene visible cuando se pierde el target 
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

document.getElementById("botonCaptura").addEventListener("click", () => {
  // Capturar la imagen desde el canvas WebGL
  const dataURL = renderer.domElement.toDataURL("image/png");

  // Crear enlace de descarga
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "captura-ar.png";
  link.click();
});

start();