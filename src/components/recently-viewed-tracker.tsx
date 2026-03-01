'use client';

import { useEffect, useRef } from "react";
import { recordProductView } from "@/app/actions/product-views";

export function RecentlyViewedTracker({ productId }: { productId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Fire-and-forget — never blocks render
    recordProductView(productId).catch(() => {});
  }, [productId]);
  return null; // renders nothing
}
