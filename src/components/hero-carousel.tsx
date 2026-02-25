'use client';

import Image from "next/image";
import Link from "next/link";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Product } from "@/lib/products";

type HeroCarouselProps = {
  products: Product[];
};

export function HeroCarousel({ products }: HeroCarouselProps) {
  if (!products.length) {
    return null;
  }

  return (
    <section className="bg-[var(--color-primary)] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-0">
        <Swiper
          modules={[Autoplay, Pagination]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          spaceBetween={32}
          className="rounded-[12px] bg-[var(--color-primary)]"
        >
          {products.map((product, index) => (
            <SwiperSlide key={product.id}>
              <article className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div className="space-y-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                    Featured drop
                  </p>
                  <h1 className="text-5xl font-semibold leading-tight">
                    {product.name}
                  </h1>
                  <p className="text-lg text-white/80">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    <span className="uppercase tracking-[0.3em]">
                      {product.brand}
                    </span>
                    <span>{product.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={`/products/${product.slug}`}
                      className="rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Shop now
                    </Link>
                    <Link
                      href="/products"
                      className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                    >
                      Explore catalog
                    </Link>
                  </div>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-white">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
