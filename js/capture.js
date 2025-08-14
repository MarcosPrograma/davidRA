export const screenshotButton = (renderer, scene, camera) => {
  // Canvas persistente fuera del evento
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");

  document.getElementById("botonCaptura").addEventListener("click", () => {
    const video = document.querySelector("video");
    if (!video) {
      alert("No se encontró el video");
      return;
    }

    // Ajustar tamaño solo si cambió
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    if (captureCanvas.width !== width || captureCanvas.height !== height) {
      captureCanvas.width = width;
      captureCanvas.height = height;
    }

    // Forzar render actual
    renderer.render(scene, camera);

    // Dibujar video + WebGL
    captureCtx.drawImage(video, 0, 0, width, height);
    captureCtx.drawImage(renderer.domElement, 0, 0, width, height);

    // Generar imagen (más rápido que toBlob y más compatible en iOS)
    const imageData = captureCanvas.toDataURL("image/png");

    // Descargar
    const link = document.createElement("a");
    link.href = imageData;
    link.download = `david-ar-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // abrir el panel
  document.getElementById("info-button").addEventListener("click", () => {
    document.getElementById("info-panel").classList.add("visible");
  });

  // cerrar el panel
  document.getElementById("close-panel").addEventListener("click", () => {
    document.getElementById("info-panel").classList.remove("visible");
  });
};
