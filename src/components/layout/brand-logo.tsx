import Image from "next/image";
import Link from "next/link";

export interface BrandLogoProps {
  href?: string;
  className?: string;
  imgClassName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  badge?: string;
  badgeClassName?: string;
}

const sizeMap = {
  xs: { dimension: 20, text: "text-base", img: "size-5" },
  sm: { dimension: 24, text: "text-xl", img: "size-6" },
  md: { dimension: 32, text: "text-2xl", img: "size-8" },
  lg: { dimension: 44, text: "text-3xl", img: "size-11" },
  xl: { dimension: 64, text: "text-4xl", img: "size-16" },
};

export function BrandLogo({
  href = "/",
  className = "",
  imgClassName = "",
  size = "md",
  showText = true,
  badge,
  badgeClassName = "bg-primary-brown text-white",
}: BrandLogoProps) {
  const config = sizeMap[size];

  const content = (
    <div className={`flex items-center gap-2.5 group ${className}`}>
      <Image
        src="/logo/karta.webp"
        alt="Logo KARTA"
        width={config.dimension}
        height={config.dimension}
        className={`object-contain rounded-md shrink-0 ${config.img} ${imgClassName}`}
        priority={size === "lg" || size === "xl"}
      />
      {showText && (
        <span
          className={`font-heading ${config.text} font-bold tracking-tight text-primary-brown`}
        >
          KARTA
        </span>
      )}
      {badge && (
        <span
          className={`text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded ${badgeClassName}`}
        >
          {badge}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
