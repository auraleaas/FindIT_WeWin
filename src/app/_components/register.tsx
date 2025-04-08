'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const handleGoogleSignIn = () => {

    alert("Google Sign-In triggered!");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FBF9E7] to-[#70CFC3]">
      <div className="w-full max-w-xs text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/img/icons/logo.svg"
            alt="Orioon Logo"
            width={180}
            height={180}
            priority
          />
        </div>

        {/* Sign in Button */}
        <button
          onClick={handleGoogleSignIn}
            className="flex items-center justify-center px-0 py-0 text-3xl font-semibold text-gray-700 bg-transparent border border-white rounded-[20px] shadow-sm hover:shadow-md transition duration-300 -mt-10 tracking-[10px]"
        >
          <Image
            src="/img/icons/google.svg"
            alt="Google"
            width={20}
            height={20}
            className="mr-2"
          />
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
