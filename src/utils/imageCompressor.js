/**
 * Client-side image compressor utility
 */
export function compressImage(file, { maxWidth = 1280, maxHeight = 1280, quality = 0.8 } = {}) {
  return new Promise((resolve) => {
    // Only compress image types
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio bounds
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas context to a compressed jpeg Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Construct a new file name and return it as a File object
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + '.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
