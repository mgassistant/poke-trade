/**
 * Client-side card recognition using OCR (Tesseract.js)
 * 
 * Strategy: Read the card number from the bottom of the card,
 * then match against our database. This is FREE and works offline.
 * 
 * Pokémon card layout:
 * - Card name: top center
 * - HP: top right  
 * - Card number: bottom left (e.g., "044/185")
 * - Set symbol: bottom right (visual icon)
 * - Illustrator: bottom
 * 
 * We crop the bottom ~20% of the image and OCR just that region
 * to extract the card number. Then we search our DB.
 */

let worker: any = null;
let workerReady = false;
let workerLoading = false;

/**
 * Initialize the Tesseract worker (loads once, reuses)
 */
async function getWorker() {
  if (workerReady && worker) return worker;
  if (workerLoading) {
    // Wait for existing initialization
    while (workerLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return worker;
  }
  
  workerLoading = true;
  try {
    const Tesseract = await import("tesseract.js");
    worker = await Tesseract.createWorker("eng", 1, {
      // Use CDN for worker files to avoid bundling issues
      workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
    });
    // Optimize for reading numbers and short text
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .-'éÉ",
      tessedit_pageseg_mode: "7", // Single text line
    });
    workerReady = true;
  } catch (err) {
    console.error("Tesseract init failed:", err);
    workerLoading = false;
    throw err;
  }
  workerLoading = false;
  return worker;
}

export interface OcrResult {
  cardNumber: string | null;       // e.g., "044/185"
  cardNumberClean: string | null;  // e.g., "44"
  cardName: string | null;         // from top crop
  rawBottomText: string;           // full OCR text from bottom
  rawTopText: string;              // full OCR text from top
  confidence: number;              // 0-100
}

/**
 * Extract card number and name from a card image using OCR
 * @param imageDataUrl - base64 data URL of the card image
 */
export async function ocrCardImage(imageDataUrl: string): Promise<OcrResult> {
  const w = await getWorker();
  
  // Create image element to get dimensions
  const img = await loadImage(imageDataUrl);
  const { width, height } = img;
  
  // Crop bottom 22% for card number (where number/set info lives)
  const bottomCanvas = cropImage(img, 0, Math.floor(height * 0.78), width, Math.floor(height * 0.22));
  const bottomDataUrl = bottomCanvas.toDataURL("image/png");
  
  // Crop top 15% for card name
  const topCanvas = cropImage(img, 0, 0, width, Math.floor(height * 0.15));
  const topDataUrl = topCanvas.toDataURL("image/png");
  
  // OCR both regions in parallel
  const [bottomResult, topResult] = await Promise.all([
    w.recognize(bottomDataUrl),
    w.recognize(topDataUrl),
  ]);
  
  const bottomText = bottomResult.data.text.trim();
  const topText = topResult.data.text.trim();
  const confidence = Math.max(bottomResult.data.confidence, topResult.data.confidence);
  
  // Extract card number from bottom text
  // Common patterns: "044/185", "4/102", "TG30/TG30", "SV065/SV121"
  const numberMatch = bottomText.match(
    /\b([A-Z]{0,3}\d{1,4})\s*[\/\\]\s*([A-Z]{0,3}\d{1,4})\b/i
  );
  
  let cardNumber: string | null = null;
  let cardNumberClean: string | null = null;
  
  if (numberMatch) {
    cardNumber = `${numberMatch[1]}/${numberMatch[2]}`;
    // Clean: remove leading zeros for DB matching
    cardNumberClean = numberMatch[1].replace(/^0+/, "") || numberMatch[1];
  }
  
  // Extract card name from top text
  // Clean up OCR artifacts
  let cardName: string | null = topText
    .replace(/\b(HP|hp)\s*\d+/g, "") // Remove HP numbers
    .replace(/\b(BASIC|STAGE\s*[12]|V|VMAX|VSTAR|ex|EX|GX)\b/gi, (m) => m) // Keep type identifiers
    .replace(/[^\w\s\-'.éÉ]/g, "") // Remove junk characters
    .trim();
  
  if (cardName && cardName.length < 2) cardName = null;
  
  return {
    cardNumber,
    cardNumberClean,
    cardName,
    rawBottomText: bottomText,
    rawTopText: topText,
    confidence,
  };
}

/**
 * Search our database using OCR results
 */
export async function searchByOcr(ocr: OcrResult): Promise<{
  matches: any[];
  method: "number" | "name" | "none";
}> {
  // Strategy 1: Card number search (most reliable)
  if (ocr.cardNumberClean) {
    try {
      const res = await fetch("/api/cards/scan/ocr-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: ocr.cardNumberClean,
          numberWithZeros: ocr.cardNumber?.split("/")[0] || ocr.cardNumberClean,
          name: ocr.cardName,
        }),
      });
      const data = await res.json();
      if (data.matches?.length > 0) {
        return { matches: data.matches, method: "number" };
      }
    } catch {
      // Fall through to name search
    }
  }
  
  // Strategy 2: Name search
  if (ocr.cardName && ocr.cardName.length >= 3) {
    try {
      const res = await fetch(`/api/cards/search?q=${encodeURIComponent(ocr.cardName)}&limit=10`);
      const data = await res.json();
      if (data.cards?.length > 0) {
        return { matches: data.cards, method: "name" };
      }
    } catch {
      // Fall through
    }
  }
  
  return { matches: [], method: "none" };
}

/* ── Helpers ── */

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function cropImage(
  img: HTMLImageElement,
  x: number, y: number,
  w: number, h: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // Enhance contrast for better OCR
  ctx.filter = "contrast(1.5) grayscale(1)";
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas;
}
