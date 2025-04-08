"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Register from "../_components/register";
import Image from "next/image";


export default function RegisterPage() {
  const [isMobile, setIsMobile] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const width = window.innerWidth;
    if (width > 768) {
      setIsMobile(false);
    }
  }, []);

  if (!isMobile) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1>Only available on mobile devices</h1>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#FBF9E7] to-[#70CFC3]">
          <div className="w-full text-center px-4">
            {/* Logo */}
            <div className="flex justify-center">
              <Image
                src="/img/icons/logo.svg"
                alt="Orioon Logo"
                width={700}
                height={700}
                priority
              />
            </div>
    
            {/* Sign in Button */}
            <div className="flex justify-center">
            <button
                onClick={() => {
                alert("Google Sign-In triggered!");
                }}
                className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-gray-700 bg-transparent border border-white rounded-[20px] shadow-sm hover:shadow-md transition duration-300 -mt-10 min-w-[300px]"
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
          </div>
        </main>
  );
}