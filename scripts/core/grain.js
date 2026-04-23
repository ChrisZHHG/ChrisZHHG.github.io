export function initGrain() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 32;
  }
  ctx.putImageData(img, 0, 0);
  const url = `url(${canvas.toDataURL('image/png')})`;
  document.querySelectorAll('.grain-film, .grain-paper').forEach((el) => {
    el.style.backgroundImage = url;
    el.style.backgroundSize = `${size}px ${size}px`;
  });
}
