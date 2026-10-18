// Photo paths only (no credits data), safe to import in client components.
/** Real dish photos live in /public/meals/<id>.webp (800×600, cropped to 4:3). */
export const photoSrc = (id: string) => `/meals/${id}.webp`;

/** Small, optimized (AVIF/WebP) version of a dish photo for thumbnails, via Next's image optimizer.
 *  `w` must be one of images.imageSizes / deviceSizes in next.config.ts (64, 96, 128, 160, 256, 384, …). */
export const thumbSrc = (id: string, w: 64 | 96 | 128 | 160 | 256 = 160) => `/_next/image?url=${encodeURIComponent(photoSrc(id))}&w=${w}&q=70`;
