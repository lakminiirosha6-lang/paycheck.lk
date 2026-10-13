import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use official cdnjs worker matching pdfjs version for stability in browser
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
}

export interface OCRProgressCallback {
  (progress: { status: string; progress: number }): void;
}

export interface OCRResult {
  text: string;
  confidence: number;
  previewUrl: string;
}

/**
 * Preprocesses an image or canvas to improve OCR recognition
 */
export const preprocessImageToCanvas = (
  img: HTMLImageElement | HTMLCanvasElement
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  let width = img.width;
  let height = img.height;

  // Scale up small images for better OCR character recognition
  const minWidth = 1200;
  if (width < minWidth && width > 0) {
    const scale = minWidth / width;
    width = minWidth;
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;

  // Draw original image
  ctx.drawImage(img, 0, 0, width, height);

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Convert to grayscale and enhance contrast
    // Standard luminance weights: 0.299 R + 0.587 G + 0.114 B
    const contrast = 25; // mild boost
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // Apply contrast
      const adjusted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }
    ctx.putImageData(imgData, 0, 0);
  } catch (e) {
    // If getImageData fails due to cross-origin or canvas limits, fallback to standard canvas
    console.warn('Preprocessing pixel filter failed, using raw canvas', e);
  }

  return canvas;
};

/**
 * Converts a PDF file into a canvas containing the first page
 */
export const convertPdfToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  // 2.0 scale gives high DPI for crisp OCR
  const viewport = page.getViewport({ scale: 2.0 });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render PDF page to canvas
  // @ts-expect-error pdfjs typing compatibility
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas;
};

/**
 * Main OCR runner for file (Image or PDF)
 */
export const runReceiptOCR = async (
  file: File,
  onProgress?: OCRProgressCallback
): Promise<OCRResult> => {
  let previewDataUrl = '';
  let canvasSource: HTMLCanvasElement;

  onProgress?.({ status: 'Preparing document', progress: 0.1 });

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    onProgress?.({ status: 'Rendering PDF page', progress: 0.2 });
    canvasSource = await convertPdfToCanvas(file);
    previewDataUrl = canvasSource.toDataURL('image/png');
  } else {
    // Image file (JPG, PNG, WebP)
    onProgress?.({ status: 'Loading image preview', progress: 0.2 });
    const imageBitmap = await createImageBitmap(file);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageBitmap.width;
    tempCanvas.height = imageBitmap.height;
    const ctx = tempCanvas.getContext('2d')!;
    ctx.drawImage(imageBitmap, 0, 0);

    previewDataUrl = tempCanvas.toDataURL('image/png');
    canvasSource = preprocessImageToCanvas(tempCanvas);
  }

  onProgress?.({ status: 'Initializing Tesseract OCR engine', progress: 0.35 });

  // Create Tesseract worker
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = 0.4 + (m.progress || 0) * 0.55;
        onProgress?.({ status: 'Recognizing text...', progress: Math.min(0.95, p) });
      }
    },
  });

  onProgress?.({ status: 'Analyzing characters and words', progress: 0.5 });

  const { data } = await worker.recognize(canvasSource);
  await worker.terminate();

  onProgress?.({ status: 'Extraction complete', progress: 1.0 });

  return {
    text: data.text || '',
    confidence: Math.round(data.confidence || 85),
    previewUrl: previewDataUrl,
  };
};
