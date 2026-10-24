/** Largest file accepted before shrinking: phone photos are a few MB, this leaves room. */
const MAX_BYTES = 20 * 1024 * 1024;
/** Edge of the saved square, enough for the largest avatar on a 3x screen. */
const EDGE = 192;

/**
 * Turns a chosen image file into a small square photo (centre crop), entirely on the device. Returns a data URL
 * of a few KB, so it can sit in the profile without filling storage. Throws when the file is not a usable image.
 */
export async function squarePhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/') || file.size > MAX_BYTES) throw new Error('not an image');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error('empty image');
    const canvas = document.createElement('canvas');
    canvas.width = EDGE;
    canvas.height = EDGE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, EDGE, EDGE);
    // WebP where the browser can write it (Safari cannot), otherwise JPEG.
    const webp = canvas.toDataURL('image/webp', 0.85);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
