import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

//UI Customizada
class uiControl {
    constructor() {
        this.loadingScreen = document.getElementById('loadingScreen');
        this.scanningScreen = document.getElementById('scanningScreen');
        this.loadingText = document.getElementById('loadingText');
        this.loadingSubtext = document.getElementById('loadingSubtext');
        this.targetLostMessage = document.getElementById('targetLostMessage');
    }

    //mostrar pantalla de carga
    showLoading() {
        this.loadingScreen.classList.remove('hidden');
        this.scanningScreen.classList.remove('visible');
        this.simulateLoading();
    }

    //ocultar pantalla de carga
    hideLoading() {
        this.loadingScreen.classList.add('hidden');
    }

    //mostrar pantalla de escaneo
    showScanning() {
        this.hideLoading();
        this.scanningScreen.classList.add('visible');
    }

    //ocultar pantalla de escaneo
    hideScanning() {
        this.scanningScreen.classList.remove('visible');
    }

    simulateLoading() {
        setTimeout(() => {
            this.hideLoading();
        }, 5000); //simula 5 segundos de carga
    }

    //métodos para integrar con MindAR
    startLoadingSequence() {
        this.showLoading();
    }

    onARReady() {
        this.showScanning();
    }

    onTargetFound() {
        this.hideScanning();
        this.targetLostMessage.style.display = 'none';
    }

    onTargetLost() {
        this.showScanning();
        this.targetLostMessage.style.display = 'block';
    }
}


//Control de movimientos suaves y deteccion movimientos bruscos
class SmoothTracker {
    constructor() {
        this.lastPosition = new THREE.Vector3();
        this.lastRotation = new THREE.Euler();
        this.lastScale = new THREE.Vector3(1, 1, 1);

        //configuración de suavizado
        this.smoothingFactor = 0.07;
        this.adaptiveSmoothingFactor = 0.07;
        this.maxSmoothingFactor = 0.3;
        this.minSmoothingFactor = 0.02;

        //detección de movimientos bruscos
        this.maxPositionDelta = 0.5;  //máximo cambio de posición permitido por frame
        this.maxRotationDelta = 0.8;  //máximo cambio de rotación permitido por frame
        this.maxScaleDelta = 0.3;     //máximo cambio de escala permitido por frame

        //buffer para promediar movimientos
        this.positionBuffer = [];
        this.rotationBuffer = [];
        this.scaleBuffer = [];
        this.bufferSize = 5;

        //estado de tracking
        this.isTracking = false;
        this.frameCount = 0;
        this.stabilizationFrames = 15;

        //velocidad de movimiento para suavizado adaptativo
        this.lastFrameTime = performance.now();
        this.velocityThreshold = 0.1;

        //predicción de movimiento
        this.velocityPosition = new THREE.Vector3();
        this.velocityRotation = new THREE.Euler();
        this.predictionStrength = 0.1;
    }

    //detectar si el movimiento es demasiado brusco
    isMovementTooAbrupt(currentPos, currentRot, currentScale) {
        const posDelta = currentPos.distanceTo(this.lastPosition);
        const rotDelta = Math.abs(currentRot.x - this.lastRotation.x) +
            Math.abs(currentRot.y - this.lastRotation.y) +
            Math.abs(currentRot.z - this.lastRotation.z);
        const scaleDelta = Math.abs(currentScale.x - this.lastScale.x);

        return posDelta > this.maxPositionDelta ||
            rotDelta > this.maxRotationDelta ||
            scaleDelta > this.maxScaleDelta;
    }

    //agregar valores al buffer para promediar
    addToBuffer(position, rotation, scale) {
        this.positionBuffer.push(position.clone());
        this.rotationBuffer.push(rotation.clone());
        this.scaleBuffer.push(scale.clone());

        if (this.positionBuffer.length > this.bufferSize) {
            this.positionBuffer.shift();
            this.rotationBuffer.shift();
            this.scaleBuffer.shift();
        }
    }

    //calcular promedio del buffer
    getAverageFromBuffer() {
        if (this.positionBuffer.length === 0) return null;

        const avgPos = new THREE.Vector3();
        const avgRot = new THREE.Euler();
        const avgScale = new THREE.Vector3();

        //promedio de posición
        this.positionBuffer.forEach(pos => avgPos.add(pos));
        avgPos.divideScalar(this.positionBuffer.length);

        //promedio de rotación
        let x = 0, y = 0, z = 0;
        this.rotationBuffer.forEach(rot => {
            x += rot.x;
            y += rot.y;
            z += rot.z;
        });
        avgRot.set(
            x / this.rotationBuffer.length,
            y / this.rotationBuffer.length,
            z / this.rotationBuffer.length
        );

        //promedio de escala
        this.scaleBuffer.forEach(scale => avgScale.add(scale));
        avgScale.divideScalar(this.scaleBuffer.length);

        return { position: avgPos, rotation: avgRot, scale: avgScale };
    }

    //calcular velocidad de movimiento
    calculateVelocity(currentPos, currentRot) {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (deltaTime > 0) {
            //calcular velocidad de posición
            const posVelocity = currentPos.clone().sub(this.lastPosition).divideScalar(deltaTime);
            this.velocityPosition.lerp(posVelocity, 0.3);

            //calcular velocidad de rotación
            const rotVelocity = new THREE.Euler(
                (currentRot.x - this.lastRotation.x) / deltaTime,
                (currentRot.y - this.lastRotation.y) / deltaTime,
                (currentRot.z - this.lastRotation.z) / deltaTime
            );
            this.velocityRotation.x = THREE.MathUtils.lerp(this.velocityRotation.x, rotVelocity.x, 0.3);
            this.velocityRotation.y = THREE.MathUtils.lerp(this.velocityRotation.y, rotVelocity.y, 0.3);
            this.velocityRotation.z = THREE.MathUtils.lerp(this.velocityRotation.z, rotVelocity.z, 0.3);
        }
    }

    //suavizado adaptativo basado en velocidad
    getAdaptiveSmoothingFactor() {
        const velocityMagnitude = this.velocityPosition.length();

        if (velocityMagnitude > this.velocityThreshold) {
            //movimiento rápido = más suavizado
            const factor = Math.min(velocityMagnitude / this.velocityThreshold, 5);
            return Math.max(this.minSmoothingFactor, this.smoothingFactor / factor);
        } else {
            //movimiento lento = menos suavizado para mejor respuesta
            return Math.min(this.maxSmoothingFactor, this.smoothingFactor * 2);
        }
    }

    //predicción de movimiento
    getPredictedPosition(currentPos, currentRot, currentScale) {
        const predictedPos = currentPos.clone().add(
            this.velocityPosition.clone().multiplyScalar(this.predictionStrength)
        );

        const predictedRot = new THREE.Euler(
            currentRot.x + this.velocityRotation.x * this.predictionStrength,
            currentRot.y + this.velocityRotation.y * this.predictionStrength,
            currentRot.z + this.velocityRotation.z * this.predictionStrength
        );

        return { position: predictedPos, rotation: predictedRot, scale: currentScale };
    }

    //función principal de suavizado
    smoothTransform(modelGroup, anchorGroup) {
        if (!modelGroup || !this.isTracking) return;

        this.frameCount++;

        const anchorPos = anchorGroup.position;
        const anchorRot = anchorGroup.rotation;
        const anchorScale = anchorGroup.scale;

        //calcular velocidad
        this.calculateVelocity(anchorPos, anchorRot);

        //detectar movimiento brusco
        if (this.isMovementTooAbrupt(anchorPos, anchorRot, anchorScale)) {
            console.log("Movimiento brusco detectado - aplicando suavizado extra");
            //usar el último valor válido o promedio del buffer
            const averaged = this.getAverageFromBuffer();
            if (averaged) {
                this.addToBuffer(averaged.position, averaged.rotation, averaged.scale);
            }
            return; //saltar este frame
        }

        //agregar al buffer
        this.addToBuffer(anchorPos, anchorRot, anchorScale);

        //aplicar suavizado después de los frames de estabilización
        if (this.frameCount > this.stabilizationFrames) {
            //obtener factor de suavizado adaptativo
            this.adaptiveSmoothingFactor = this.getAdaptiveSmoothingFactor();

            //obtener predicción
            const predicted = this.getPredictedPosition(anchorPos, anchorRot, anchorScale);

            //usar promedio del buffer si está disponible
            const averaged = this.getAverageFromBuffer();
            const targetPos = averaged ? averaged.position : predicted.position;
            const targetRot = averaged ? averaged.rotation : predicted.rotation;
            const targetScale = averaged ? averaged.scale : predicted.scale;

            //aplicar suavizado
            this.lastPosition.lerp(targetPos, this.adaptiveSmoothingFactor);
            modelGroup.position.copy(this.lastPosition);

            //suavizar rotación
            this.lastRotation.x += (targetRot.x - this.lastRotation.x) * this.adaptiveSmoothingFactor;
            this.lastRotation.y += (targetRot.y - this.lastRotation.y) * this.adaptiveSmoothingFactor;
            this.lastRotation.z += (targetRot.z - this.lastRotation.z) * this.adaptiveSmoothingFactor;
            modelGroup.rotation.copy(this.lastRotation);

            //suavizar escala
            this.lastScale.lerp(targetScale, this.adaptiveSmoothingFactor);
            modelGroup.scale.copy(this.lastScale);
        }
    }

    onTargetFound() {
        this.isTracking = true;
        this.frameCount = 0;
        //limpiar buffers
        this.positionBuffer = [];
        this.rotationBuffer = [];
        this.scaleBuffer = [];
        console.log("Target encontrado - iniciando tracking suave");
    }

    onTargetLost() {
        this.isTracking = false;
        console.log("Target perdido - deteniendo tracking");
    }

    //configurar sensibilidad dinámicamente
    setSensitivity(level) {
        switch (level) {
            case 'low':
                this.maxPositionDelta = 0.2;
                this.maxRotationDelta = 0.3;
                this.smoothingFactor = 0.03;
                this.bufferSize = 8;
                break;
            case 'medium':
                this.maxPositionDelta = 0.5;
                this.maxRotationDelta = 0.8;
                this.smoothingFactor = 0.07;
                this.bufferSize = 5;
                break;
            case 'high':
                this.maxPositionDelta = 1.0;
                this.maxRotationDelta = 1.5;
                this.smoothingFactor = 0.15;
                this.bufferSize = 3;
                break;
        }
    }
}

const uiControlador = new uiControl();
const smoothTracker = new SmoothTracker();

smoothTracker.setSensitivity('medium');
uiControlador.startLoadingSequence();

//iniciar mindAR 
const mindarThree = new MindARThree({
    container: document.querySelector("#container"),
    imageTargetSrc: "https://cdn.glitch.global/65e71ed9-5bd3-4f28-832d-b9b8da88b976/targets.mind?v=1748745952253",
    filterMinCF: 0.0001, //controlar la suavidad: valor bajo > mas suavidad y menos vibración  
    filterBeta: 8, //ajustar como responde el filtro a cambios rapidos: alto valor > respuesta rapida y menos delay 
    warmupTolerance: 15, //espera 8 frames antes de activar el modelo  
    missTolerance: 30, //tolerancia en el que el modelo se mantiene visible cuando se pierde el target 
    showStats: false,
    uiLoading: false,
    uiScanning: false,
});

const { renderer, scene, camera } = mindarThree;
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
scene.add(light);

let lastPosition = new THREE.Vector3();
let lastRotation = new THREE.Euler();
let lastScale = new THREE.Vector3(1, 1, 1);
const smoothingFactor = 0.07; //ajustar entre 0.05 (muy suave) y 0.3 (más responsivo)
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
                child.frustumCulled = false; // evitar culling que puede causar flickering
            }
        });

        anchor.group.add(model);

        //inicializar posiciones en el tracker
        smoothTracker.lastPosition.copy(modelGroup.position);
        smoothTracker.lastRotation.copy(modelGroup.rotation);
        smoothTracker.lastScale.copy(modelGroup.scale);
    }
);

//eventos de tracking
anchor.onTargetFound = () => {
    console.log("Target encontrado");
    isTracking = true;
    frameCount = 0;

    // Asegurarse de que la UI original esté oculta
    const loadingUI = document.querySelector("#loading-ui");
    const scanningUI = document.querySelector("#scanning-ui");

    if (loadingUI) loadingUI.classList.add("hidden");
    if (scanningUI) scanningUI.classList.add("hidden");
    uiControlador.onTargetFound();
};

anchor.onTargetLost = () => {
    console.log("Target perdido");
    isTracking = false;
    // Mantener la UI original oculta
    const loadingUI = document.querySelector("#loading-ui");
    const scanningUI = document.querySelector("#scanning-ui");

    if (loadingUI) loadingUI.classList.add("hidden");
    if (scanningUI) scanningUI.classList.add("hidden");
    uiControlador.onTargetLost();
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

//agregar controles para ajustar sensibilidad dinámicamente
window.setSensitivity = (level) => {
    smoothTracker.setSensitivity(level);
    console.log(`Sensibilidad cambiada a: ${level}`);
};

//iniciar AR
const start = async () => {
    await mindarThree.start();
    uiControlador.onARReady();
    renderer.setAnimationLoop(() => {
        smoothTracker.smoothTransform(modelGroup, anchor.group);
        renderer.render(scene, camera);
    });
};

start();