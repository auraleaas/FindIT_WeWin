"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InputField from "../_components/inputField";

export default function EmailPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const router = useRouter();

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleNext = () => {
    if (email.trim() === "") {
      setEmailError("Email tidak boleh kosong.");
      return;
    }

    if (!isValidEmail(email)) {
        setEmailError("Format email tidak valid.\nContoh: email@example.com");
        return;
      }

    // Reset error dan lanjut
    setEmailError("");
    router.push("/home");
  };

  return (
    <div className="flex flex-col min-h-screen px-6 py-10 bg-white">
      {/* Tombol kembali */}
      <button
        onClick={() => router.back()}
        className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center mb-10"
      >
        <Image
          src="/img/icons/Vector.svg"
          alt="Back"
          width={10}
          height={10}
        />
      </button>

      {/* Judul pertanyaan */}
      <h1 className="text-center text-2xl font-semibold text-[#2B2B2B] mb-6 mt-45">
        Apa alamat email Anda?
      </h1>

      {/* Input email */}
      <InputField
        placeholderText="email Anda"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Pesan error */}
      {emailError && (
        <div className="text-red-500 text-sm mt-2 space-y-1">
            {emailError.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
            ))}
        </div>
        )}

      {/* Tombol lanjut */}
      <button
        onClick={handleNext}
        className="w-full bg-[#4BA397] text-white text-base font-semibold py-5 rounded-full shadow-md mt-8 hover:bg-[#3e8f7d] transition duration-300"
      >
        Lanjut
      </button>
    </div>
  );
}
