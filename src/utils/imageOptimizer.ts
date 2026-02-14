// Optimisation des images pour de meilleures performances
// Utilise des CDN d'images quand possible

interface ImageSize {
  width: number;
  height: number;
  quality?: number;
}

// Detecte le type de CDN/source de l'image
const detectImageSource = (url: string): 'cloudinary' | 'imgix' | 'unsplash' | 'picsum' | 'generic' => {
  if (url.includes('cloudinary.com')) return 'cloudinary';
  if (url.includes('imgix.net')) return 'imgix';
  if (url.includes('unsplash.com')) return 'unsplash';
  if (url.includes('picsum.photos')) return 'picsum';
  return 'generic';
};

// Optimise une URL Cloudinary
const optimizeCloudinary = (url: string, size: ImageSize): string => {
  const transforms = `w_${size.width},h_${size.height},c_fill,q_${size.quality || 80},f_auto`;
  return url.replace('/upload/', `/upload/${transforms}/`);
};

// Optimise une URL Imgix
const optimizeImgix = (url: string, size: ImageSize): string => {
  const params = new URLSearchParams({
    w: String(size.width),
    h: String(size.height),
    fit: 'crop',
    q: String(size.quality || 80),
    auto: 'format',
  });
  return `${url}?${params.toString()}`;
};

// Optimise une URL Unsplash
const optimizeUnsplash = (url: string, size: ImageSize): string => {
  const params = new URLSearchParams({
    w: String(size.width),
    h: String(size.height),
    fit: 'crop',
    q: String(size.quality || 80),
  });
  return `${url}&${params.toString()}`;
};

// Optimise une URL Picsum
const optimizePicsum = (url: string, size: ImageSize): string => {
  // Format: https://picsum.photos/seed/xxx/width/height
  const match = url.match(/picsum\.photos\/seed\/([^/]+)/);
  if (match) {
    return `https://picsum.photos/seed/${match[1]}/${size.width}/${size.height}`;
  }
  return url;
};

/**
 * Optimise une URL d'image pour une taille specifique
 * Utilise les transformations CDN quand disponibles
 */
export const getOptimizedImageUrl = (
  url: string | undefined,
  size: ImageSize
): string | undefined => {
  if (!url) return undefined;

  try {
    const source = detectImageSource(url);

    switch (source) {
      case 'cloudinary':
        return optimizeCloudinary(url, size);
      case 'imgix':
        return optimizeImgix(url, size);
      case 'unsplash':
        return optimizeUnsplash(url, size);
      case 'picsum':
        return optimizePicsum(url, size);
      default:
        return url;
    }
  } catch {
    return url;
  }
};

/**
 * Genere un placeholder color basé sur le nom
 */
export const getPlaceholderColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

/**
 * Tailles d'image predefinies
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 80, height: 80, quality: 70 },
  small: { width: 150, height: 150, quality: 75 },
  medium: { width: 300, height: 300, quality: 80 },
  large: { width: 600, height: 400, quality: 85 },
  hero: { width: 800, height: 450, quality: 90 },
} as const;

export default {
  getOptimizedImageUrl,
  getPlaceholderColor,
  IMAGE_SIZES,
};
