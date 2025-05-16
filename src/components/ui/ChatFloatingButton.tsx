import Link from 'next/link';
import { IoChatbubblesOutline } from "react-icons/io5";

export default function ChatFloatingButton() {
  return (
    <Link
      href="/ai-voice"
      className="fixed z-50 bottom-24 right-6 bg-[#4CD6C1] hover:bg-[#6ED6D6] text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center transition-colors duration-200"
      aria-label="Open AI Voice Assistant"
    >
      <IoChatbubblesOutline className="text-3xl" />
    </Link>
  );
} 