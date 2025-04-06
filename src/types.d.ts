// Type declarations for image resources
declare module '*.png' {
  const pngImage: string;
  export default pngImage;
}

declare module '*.jpg' {
  const jpgImage: string;
  export default jpgImage;
}

declare module '*.svg' {
  const svgImage: string;
  export default svgImage;
}

// Extension for Navigator with deviceMemory
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
} 