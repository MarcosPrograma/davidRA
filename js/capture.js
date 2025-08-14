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

      //iOS (Safari) o Android: usar DataURL
      if (isIOS || isAndroid) {
        const imageData = captureCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = `david-ar-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      //resto: usar Blob
      else {
        captureCanvas.toBlob((blob) => {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `david-ar-${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          //revocar después de un pequeño delay
          setTimeout(() => URL.revokeObjectURL(link.href), 1500);
        }, "image/png");
      }
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
