'use client'
import BackgroundWrapper from "@/components/ui/BackgroundWrapper";

export default function ClientLayout({ children }) {
  // Plus de state ici, juste le fond de base
  return (
    <>
      <BackgroundWrapper isCakeBackground={false} />
      <main className="relative z-10">{children}</main>
    </>
  );
}
