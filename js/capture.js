export const screenshotButton = (renderer, scene, camera) => {
  const captureCanvas = document.createElement("canvas");
  const captureCtx = captureCanvas.getContext("2d");
  
  // Detección más robusta de dispositivos
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /android/i.test(userAgent);
  const isMobile = isIOS || isAndroid;

  document.getElementById("botonCaptura").addEventListener("click", function() {
    try {
      const video = document.querySelector("video");
      
      // Validaciones más robustas
      if (!video) {
        alert("No se encontró el video");
        return;
      }
      
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        alert("El video no está listo. Espera un momento.");
        return;
      }

      // Obtener dimensiones de manera compatible
      let width = renderer.domElement.width;
      let height = renderer.domElement.height;
      
      // Fallback para navegadores que no reportan width/height
      if (!width || !height) {
        width = renderer.domElement.clientWidth || 640;
        height = renderer.domElement.clientHeight || 480;
      }

      // Ajustar canvas solo si cambió
      if (captureCanvas.width !== width || captureCanvas.height !== height) {
        captureCanvas.width = width;
        captureCanvas.height = height;
      }

      // Renderizar la escena
      renderer.render(scene, camera);

      // Limpiar canvas antes de dibujar
      captureCtx.clearRect(0, 0, width, height);
      captureCtx.save();

      // Dibujar video primero (fondo)
      try {
        captureCtx.drawImage(video, 0, 0, width, height);
      } catch (videoError) {
        console.warn("Error dibujando video:", videoError);
      }

      // Dibujar WebGL encima
      try {
        captureCtx.drawImage(renderer.domElement, 0, 0, width, height);
      } catch (webglError) {
        console.warn("Error dibujando WebGL:", webglError);
      }

      captureCtx.restore();

      const filename = "david-ar-" + Date.now() + ".png";

      // iOS - usar dataURL directo
      if (isIOS) {
        downloadWithDataURL(captureCanvas, filename);
        return;
      }

      // Android con Share API (solo si está disponible)
      if (isAndroid && isShareAPIAvailable()) {
        shareImage(captureCanvas, filename);
        return;
      }

      // Android fallback o dispositivos sin Share API
      if (isAndroid) {
        downloadWithDataURL(captureCanvas, filename);
        return;
      }

      // Escritorio - usar Blob si está disponible
      if (typeof captureCanvas.toBlob === 'function') {
        downloadWithBlob(captureCanvas, filename);
      } else {
        // Fallback para navegadores muy antiguos
        downloadWithDataURL(captureCanvas, filename);
      }

    } catch (error) {
      console.error("Error en captura:", error);
      alert("Error al tomar la captura. Tu navegador podría no ser compatible.");
    }
  });

  // Funciones auxiliares para compatibilidad
  function isShareAPIAvailable() {
    return typeof navigator.canShare === 'function' && 
           typeof navigator.share === 'function' &&
           'files' in navigator;
  }

  function downloadWithDataURL(canvas, filename) {
    try {
      const imageData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      
      // Compatibilidad con IE/Edge
      if (typeof link.download !== 'undefined') {
        link.href = imageData;
        link.download = filename;
        
        // Agregar al DOM temporalmente para IE
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fallback para navegadores muy antiguos
        window.open(imageData, '_blank');
      }
    } catch (error) {
      console.error("Error en descarga con DataURL:", error);
      alert("No se pudo descargar la imagen");
    }
  }

  function downloadWithBlob(canvas, filename) {
    canvas.toBlob(function(blob) {
      if (!blob) {
        downloadWithDataURL(canvas, filename);
        return;
      }

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar memoria después de un tiempo
      setTimeout(function() {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          // Ignorar errores de cleanup
        }
      }, 1000);
    }, "image/png");
  }

  function shareImage(canvas, filename) {
    canvas.toBlob(function(blob) {
      if (!blob) {
        downloadWithDataURL(canvas, filename);
        return;
      }

      try {
        const file = new File([blob], filename, { type: "image/png" });
        navigator.share({
          files: [file],
          title: "Captura AR"
        }).catch(function(err) {
          console.warn("Share cancelado:", err);
          // Fallback a descarga directa
          downloadWithDataURL(canvas, filename);
        });
      } catch (error) {
        console.warn("Error creando File:", error);
        downloadWithDataURL(canvas, filename);
      }
    }, "image/png");
  }

  // abrir el panel
  document.getElementById("info-button").addEventListener("click", () => {
    document.getElementById("info-panel").classList.add("visible");
  });

  // cerrar el panel
  document.getElementById("close-panel").addEventListener("click", () => {
    document.getElementById("info-panel").classList.remove("visible");
  });
};
