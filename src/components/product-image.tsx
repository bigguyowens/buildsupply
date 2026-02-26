'use client';

import Image from "next/image";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a product image, falling back to /no-image.svg if src is empty.
 * Uses a plain <img> for the SVG fallback to avoid Next.js Image optimization issues.
 */
export function ProductImage({ src, alt, fill, sizes, priority, className, style }: ProductImageProps) {
  const hasImage = src && src.trim() !== "";

  if (!hasImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/no-image.svg"
        alt={alt}
        className={className}
        style={{
          // fill=true means Next <Image> renders as position:absolute inset-0
          // We must match that so the parent aspect-ratio container works correctly
          ...(fill ? {
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          } : {}),
          objectFit: "contain",
          ...style,
        }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      style={style}
    />
  );
}
