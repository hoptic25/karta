import Image from "next/image";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 border-3 border-beige border-t-earth-primary rounded-full animate-spin" />
        <Image
          src="/logo/karta.webp"
          alt="Logo KARTA"
          width={32}
          height={32}
          className="absolute rounded-md object-contain"
          priority
        />
      </div>
    </div>
  );
}
