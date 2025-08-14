export const screenshotButton = (renderer, scene, camera) => {
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");
  //detectar iOS (Safari)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);

  document.getElementById("botonCaptura").addEventListener("click", () => {
    const video = document.querySelector("video");
    if (!video) {
      alert("No se encontró el video");
      return;
    }

    //ajustar tamaño solo si cambió
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    if (captureCanvas.width !== width || captureCanvas.height !== height) {
      captureCanvas.width = width;
      captureCanvas.height = height;
    }

    //forzar render actual
    renderer.render(scene, camera);

    //dibujar video + WebGL
    requestAnimationFrame(() => {
      renderer.render(scene, camera);
      captureCtx.drawImage(video, 0, 0, width, height);
      captureCtx.drawImage(renderer.domElement, 0, 0, width, height);

      //iOS
      if (isIOS) {
        const imageData = captureCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = `david-ar-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      //Android con Share API
      if (isAndroid && navigator.canShare) {
        captureCanvas.toBlob((blob) => {
          const file = new File([blob], `david-ar-${Date.now()}.png`, { type: "image/png" });
          navigator.share({
            files: [file],
            title: "Captura AR"
          }).catch(err => console.warn("Share cancelado o fallido:", err));
        }, "image/png");
        return;
      }

      //Android sin Share API (fallback DataURL)
      if (isAndroid) {
        const imageData = captureCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = `david-ar-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      //Escritorio
      captureCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `david-ar-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1500);
      }, "image/png");
    });
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
