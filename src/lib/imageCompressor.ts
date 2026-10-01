// Client-side image compression utility for Firestore-only architecture
// Enforces document size restrictions (< 500KB per image, target ~80-200KB WebP)

export interface CompressedImageResult {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
  format: 'image/webp' | 'image/jpeg';
}

const MAX_IMAGE_DIMENSION = 1024;
const TARGET_MAX_BYTES = 350 * 1024; // 350KB max threshold for Firestore field

/**
 * Validates whether a file is an acceptable image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WEBP, or GIF images are allowed.' };
  }
  // Hard ceiling before compression: 8MB
  if (file.size > 8 * 1024 * 1024) {
    return { valid: false, error: 'File exceeds 8MB. Please select a smaller photo.' };
  }
  return { valid: true };
}

/**
 * Compresses an image File or Base64 string to a lightweight WebP/JPEG data URL
 */
export async function compressImageForFirestore(
  fileOrBlob: File | Blob,
  maxDimension = MAX_IMAGE_DIMENSION,
  quality = 0.8
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Unable to create canvas rendering context'));
        }

        // Draw image smoothly
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first with fallback to JPEG
        let mimeType: 'image/webp' | 'image/jpeg' = 'image/webp';
        let dataUrl = canvas.toDataURL('image/webp', quality);

        if (!dataUrl.startsWith('data:image/webp')) {
          mimeType = 'image/jpeg';
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estimate size
        let sizeBytes = Math.round((dataUrl.length * 3) / 4);

        // If still too large, step down quality
        if (sizeBytes > TARGET_MAX_BYTES && quality > 0.4) {
          const reducedQuality = quality - 0.25;
          dataUrl = canvas.toDataURL(mimeType, reducedQuality);
          sizeBytes = Math.round((dataUrl.length * 3) / 4);
        }

        resolve({
          dataUrl,
          sizeBytes,
          width,
          height,
          format: mimeType,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}
