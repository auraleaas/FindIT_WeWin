"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InputField from "../_components/inputField";

export default function NamePage() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const router = useRouter();

  const handleNext = () => {
    if (name.trim() === "") {
      setNameError("Nama tidak boleh kosong.");
      return;
    }

    localStorage.setItem("userName", name);

    // Reset error dan lanjut
    setNameError("");
    router.push("/setProfile/email");
  };

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setName(savedName);
    }
  }, []);
  

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
        Siapa nama Anda?
      </h1>

      {/* Input nama */}
      <InputField
        placeholderText="nama Anda"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Pesan error */}
      {nameError && (
        <p className="text-red-500 text-sm mt-2">{nameError}</p>
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
