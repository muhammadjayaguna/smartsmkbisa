"use client";

const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="aspect-square bg-muted skeleton-shimmer" />
    <div className="space-y-2.5 p-2.5">
      <div className="h-3 w-4/5 rounded-md bg-muted skeleton-shimmer" />
      <div className="h-3 w-3/5 rounded-md bg-muted skeleton-shimmer delay-100" />
      <div className="h-4 w-2/5 rounded-md bg-muted skeleton-shimmer delay-200" />
      <div className="h-2.5 w-3/4 rounded-md bg-muted skeleton-shimmer delay-300" />
    </div>
  </div>
);

export default ProductCardSkeleton;
