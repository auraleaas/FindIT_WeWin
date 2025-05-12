import Image from "next/image";
import React from "react";

function hexToRgba(hex: string, alpha = 1) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}

function lighten(hex: string, percent: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.floor(r + (255 - r) * percent));
  g = Math.min(255, Math.floor(g + (255 - g) * percent));
  b = Math.min(255, Math.floor(b + (255 - b) * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darken(hex: string, percent: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface AchievementCardProps {
  image: string;
  title: string;
  desc: string;
  star: number; // 0-5
  color: string; // hex
}

export default function AchievementCard({ image, title, desc, star, color }: AchievementCardProps) {
  const light = lighten(color, 0.5);
  const dark = darken(color, 0.2);
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 h-[96px]"
      style={{
        background: `linear-gradient(90deg, ${light} 0%, ${dark} 100%)`
      }}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-full overflow-hidden">
        <Image src={image} alt={title} width={40} height={40} />
      </div>
      <div className="flex-1">
        <div className="flex flex-row justify-between">
          <div className="font-medium text-white text-base mb-1">{title}</div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={i < star ? "text-yellow-300" : "text-white/50"}>★</span>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-white/90 mb-1">{desc}</div>
      </div>
    </div>
  );
}