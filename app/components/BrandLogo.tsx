"use client";

import Image from "next/image";

type BrandLogoProps = {
  showText?: boolean;
  size?: number;
  className?: string;
  textClassName?: string;
};

export default function BrandLogo({
  showText = true,
  size = 64,
  className,
  textClassName,
}: BrandLogoProps) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Image
        src="/skillForgeLogo.png"
        alt=""
        aria-hidden
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        priority
      />
      {showText ? <span className={textClassName}>SkillForge</span> : null}
    </span>
  );
}