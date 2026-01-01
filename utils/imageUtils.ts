import { GridConfig, Resolution, AspectRatio } from '../types';

export const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const imageToDataURL = (img: HTMLImageElement, maxSize?: number): string => {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;

  if (maxSize && (width > maxSize || height > maxSize)) {
    const scale = Math.min(maxSize / width, maxSize / height);
    width = Math.floor(width * scale);
    height = Math.floor(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

export const getTargetDimensions = (resolution: Resolution, ratio: AspectRatio) => {
  if (ratio === '16:9') {
    switch (resolution) {
      case '1K': return { width: 1920, height: 1080 };
      case '2K': return { width: 2560, height: 1440 };
      case '4K': return { width: 3840, height: 2160 };
    }
  } else if (ratio === '9:16') {
    switch (resolution) {
      case '1K': return { width: 1080, height: 1920 };
      case '2K': return { width: 1440, height: 2560 };
      case '4K': return { width: 2160, height: 3840 };
    }
  } else {
    // 1:1
    switch (resolution) {
      case '1K': return { width: 1024, height: 1024 };
      case '2K': return { width: 2048, height: 2048 };
      case '4K': return { width: 3072, height: 3072 }; // Capped slightly below max 4096 for safety
    }
  }
  return { width: 1024, height: 1024 };
};

export const splitImage = (
  image: HTMLImageElement,
  config: GridConfig
): string[] => {
  const { rows, cols, targetWidth, targetHeight, boundingBoxes } = config;
  const panels: string[] = [];
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('Could not get canvas context');

  // Enable high quality image scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (boundingBoxes && boundingBoxes.length > 0) {
    // Process Irregular Panels via Bounding Boxes
    boundingBoxes.forEach(box => {
      // Clear canvas
      ctx.clearRect(0, 0, targetWidth, targetHeight);

      // Convert 0-1000 normalized coordinates to pixel values
      const x = (box.xmin / 1000) * image.width;
      const y = (box.ymin / 1000) * image.height;
      const w = ((box.xmax - box.xmin) / 1000) * image.width;
      const h = ((box.ymax - box.ymin) / 1000) * image.height;

      // Sanity check to avoid invalid canvas states
      if (w <= 0 || h <= 0) return;

      // Draw the specific detected chunk scaled to target resolution
      // Note: This stretches the cut to the target aspect ratio (16:9 or 1:1). 
      // The AI re-imagination step will handle the rest.
      ctx.drawImage(
        image,
        x, y, w, h,    // Source
        0, 0, targetWidth, targetHeight // Dest
      );
      panels.push(canvas.toDataURL('image/png', 1.0));
    });

  } else {
    // Standard Grid Logic
    const chunkWidth = image.width / cols;
    const chunkHeight = image.height / rows;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Clear canvas for transparency safety (though we overwrite it)
        ctx.clearRect(0, 0, targetWidth, targetHeight);

        // Draw the specific chunk scaled to target resolution
        ctx.drawImage(
          image,
          col * chunkWidth, // Source X
          row * chunkHeight, // Source Y
          chunkWidth,       // Source Width
          chunkHeight,      // Source Height
          0,                // Dest X
          0,                // Dest Y
          targetWidth,      // Dest Width
          targetHeight      // Dest Height
        );

        panels.push(canvas.toDataURL('image/png', 1.0));
      }
    }
  }

  return panels;
};