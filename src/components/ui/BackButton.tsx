'use client';

import { IoIosArrowBack } from "react-icons/io";

export default function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="bg-white rounded-lg p-2 shadow inline-flex items-center"
      aria-label="Back"
    >
      <IoIosArrowBack className="h-6 w-6 text-black" />
    </button>
  );
}