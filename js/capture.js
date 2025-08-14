export const screenshotButton = (renderer, scene, camera) => {
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(navigator.userAgent);

  document.getElementById("botonCaptura").addEventListener("click", async () => {
    try {
      const video = document.querySelector("video");
      if (!video || video.videoWidth === 0) {
        alert("No se encontró el video o no está listo");
        return;
      }

      // Obtener dimensiones correctas
      const width = renderer.domElement.width || renderer.domElement.clientWidth;
      const height = renderer.domElement.height || renderer.domElement.clientHeight;

      // Ajustar canvas solo si cambió
      if (captureCanvas.width !== width || captureCanvas.height !== height) {
        captureCanvas.width = width;
        captureCanvas.height = height;
      }

      // Asegurar que el renderer esté actualizado
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);

      // Esperar un frame para que el render se complete
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Limpiar canvas
      captureCtx.clearRect(0, 0, width, height);

      // Combinar video + WebGL
      captureCtx.drawImage(video, 0, 0, width, height);
      captureCtx.globalCompositeOperation = 'source-over';
      captureCtx.drawImage(renderer.domElement, 0, 0, width, height);

      // Generar filename
      const filename = `david-ar-${Date.now()}.png`;

      // iOS con DataURL
      if (isIOS) {
        const imageData = captureCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Android con Share API
      if (isAndroid && navigator.canShare && 'files' in navigator) {
        try {
          const blob = await new Promise(resolve => 
            captureCanvas.toBlob(resolve, "image/png")
          );
          const file = new File([blob], filename, { type: "image/png" });
          await navigator.share({ files: [file], title: "Captura AR" });
          return;
        } catch (shareError) {
          console.warn("Share API falló:", shareError);
          // Continuar con descarga directa
        }
      }

      // Android sin Share API o fallback
      if (isAndroid) {
        const imageData = captureCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = imageData;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Escritorio con Blob + descarga
      captureCanvas.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, "image/png");

    } catch (error) {
      console.error("Error en captura:", error);
      alert("Error al tomar la captura. Intenta de nuevo.");
    }
  });

  // Abrir el panel
  document.getElementById("info-button")?.addEventListener("click", () => {
    document.getElementById("info-panel")?.classList.add("visible");
  });

  // Cerrar el panel
  document.getElementById("close-panel")?.addEventListener("click", () => {
    document.getElementById("info-panel")?.classList.remove("visible");
  });
};