import React from "react";
import Image from "next/image";

interface BookCardProps {
  image: string;
  title: string;
  author: string;
  category: string;
  onRead?: () => void;
}

export default function BookCard({ image, title, author, category, onRead }: BookCardProps) {
  return (
    <div className="rounded-2xl bg-[#FFD966] p-3 flex flex-col items-center shadow-sm">
      <div className="w-full h-36 flex items-center justify-center mb-2">
        <Image src={image} alt={title} width={90} height={130} className="rounded" />
      </div>
      <div className="w-full">
        <div className="font-semibold text-xs text-gray-900">{title}</div>
        <div className="text-xs text-gray-700">{author}</div>
        <div className="text-xs text-gray-500 mb-2">{category}</div>
        <button
          className="w-full bg-white text-gray-500 text-xs font-medium rounded-full py-1 border border-gray-500 hover:text-white transition"
          onClick={onRead}
        >
          Read
        </button>
      </div>
    </div>
  );
}