export const screenshotButton = (renderer, scene, camera) => {
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");

  document.getElementById("botonCaptura").addEventListener("click", () => {
    const video = document.querySelector("video");
    if (!video) {
      alert("No se encontró el video");
      return;
    }

    //ajustar tamaño
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    captureCanvas.width = width;
    captureCanvas.height = height;

    //forzar render actual
    renderer.render(scene, camera);

    //dibujar video
    captureCtx.drawImage(video, 0, 0, width, height);
    captureCtx.drawImage(renderer.domElement, 0, 0, width, height);

    //descargar
    captureCanvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `david-ar-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href); // evitar fugas
    }, "image/png");
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
