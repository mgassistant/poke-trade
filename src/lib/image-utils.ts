/**
 * Client-side image compression and resizing utilities
 * Ensures images are small enough for API calls and fast enough for batch processing
 */

/**
 * Resize and compress an image to a max dimension and quality
 * Returns a base64 data URL
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 800,
  maxHeight = 1100,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl); // fallback to original
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Compress for single card scanning (moderate quality, fast)
 */
export function compressForScan(dataUrl: string): Promise<string> {
  return compressImage(dataUrl, 640, 900, 0.75);
}

/**
 * Compress for binder page (higher res needed to see multiple cards)
 */
export function compressForBinder(dataUrl: string): Promise<string> {
  return compressImage(dataUrl, 1200, 1600, 0.8);
}

/**
 * Read a File as base64 data URL with compression
 */
export async function readAndCompressFile(
  file: File,
  maxWidth = 640,
  maxHeight = 900,
  quality = 0.75
): Promise<string> {
  const raw = await readFileAsDataUrl(file);
  return compressImage(raw, maxWidth, maxHeight, quality);
}

/**
 * Read a File as data URL (no compression)
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.readAsDataURL(file);
  });
}
