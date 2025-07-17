export const screenshotButton = (renderer, scene, camera) => {
  document.getElementById("botonCaptura").addEventListener("click", async () => {
    const video = document.querySelector("video");
    if (!video) {
      alert("No se encontró el video");
      return;
    }

    //forzar renderizado manual antes de captura, por si AnimationLoop termino
    renderer.render(scene, camera);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    //esperar un frame
    const width = renderer.domElement.width;
    const height = renderer.domElement.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    //dibujar el video de fondo
    ctx.drawImage(video, 0, 0, width, height);

    //dibujar el canvas de WebGL con el modelo 3D renderizado
    ctx.drawImage(renderer.domElement, 0, 0, width, height);

    //descargar
    canvas.toBlob((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "david-ar.png";
      link.click();
    }, "image/png");
  });
};
