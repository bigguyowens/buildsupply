'use client';

import Image from "next/image";

// Inline SVG data URI — no file dependency, always works
const NO_IMAGE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E" +
  "%3Crect width='400' height='300' fill='%23f1f5f9'/%3E" +
  "%3Crect x='150' y='90' width='100' height='80' rx='6' fill='%23cbd5e1'/%3E" +
  "%3Ccircle cx='175' cy='115' r='12' fill='%2394a3b8'/%3E" +
  "%3Cpolygon points='150,170 190,130 220,155 250,120 250,170' fill='%2394a3b8'/%3E" +
  "%3Ctext x='200' y='205' font-family='sans-serif' font-size='13' fill='%2394a3b8' text-anchor='middle'%3ENo Image%3C/text%3E" +
  "%3C/svg%3E";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ProductImage({ src, alt, fill, sizes, priority, className, style }: ProductImageProps) {
  const hasImage = src && src.trim() !== "";

  if (!hasImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={NO_IMAGE_URI}
        alt={alt}
        className={className}
        style={{
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
