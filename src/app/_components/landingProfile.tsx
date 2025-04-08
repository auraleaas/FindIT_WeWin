"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/setProfile/name");
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Bagian atas dengan background hijau melengkung */}
      {/* Bagian atas dengan background hijau melengkung */}
    <div className="relative w-full h-[550px] flex items-end pt-12 overflow-hidden">
    {/* Lingkaran besar dekoratif */}
    <div className="absolute w-[797px] h-[719px] bg-[#6DD0C3] rounded-full -z-5 -top-120px] left-[calc(50%-345px)]" />

    {/* Ilustrasi */}
    <Image
        src="/img/icons/Ilustration.svg"
        alt="Illustration"
        width={700}
        height={700}
        priority
        className="absolute bottom-0 translate-y-[-70px]"
    />
    </div>

      {/* Teks promosi */}
      <div className="text-left px-10 mt-6">
        <h1 className="text-3xl font-medium text-black">Buat Profilmu</h1>
        <h1 className="text-3xl font-semibold mt-1 text-black">Sekarang!</h1>
        <p className="text-medium text-[#989EA7] mt-6">
          Buat akun sekarang untuk menyimpan progres belajar Anda dan melanjutkan belajar kapan saja!
        </p>
      </div>

      {/* Tombol lanjut */}
      <div className="w-full px-10 mt-10">
        <button
          onClick={handleNext}
          className="w-full bg-[#34C7A3] text-white text-base font-semibold py-3 rounded-full shadow-md hover:bg-[#2bb194] transition duration-300"
        >
          Lanjut
        </button>
      </div>
    </div>
  );
}
