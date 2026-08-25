import { WishlistProvider } from "@/contexts/marketplace/WishlistContext";
import { AIDraftProvider } from "@/contexts/marketplace/AIDraftContext";
import { Suspense } from "react";

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    
      <WishlistProvider>
        <AIDraftProvider>
          <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading marketplace...</div>}>
            {children}
          </Suspense>
        </AIDraftProvider>
      </WishlistProvider>
    
  );
}
