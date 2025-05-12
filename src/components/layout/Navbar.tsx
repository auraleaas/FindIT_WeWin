import Link from "next/link"
import { FaBookOpen, FaHome, FaUserCircle } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl border py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center">
        <Link href="/e-book" className="flex flex-col items-center p-2">
          <FaBookOpen className="h-6 w-6 text-gray-500" />
          <span className="text-xs text-gray-500 mt-1">E-Book</span>
        </Link>
        <Link href="/home" className="flex flex-col items-center p-2">
          <FaHome className="h-6 w-6 text-gray-500" />
          <span className="text-xs text-gray-500 mt-1">Home</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center p-2">
          <FaUserCircle className="h-6 w-6 text-gray-500" />
          <span className="text-xs text-gray-500 mt-1">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
