import Link from "next/link"
import { Book, Home, User } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
      <div className="flex justify-around items-center">
        <Link href="/ebook" className="flex flex-col items-center p-2">
          <Book className="h-6 w-6 text-gray-500" />
          <span className="text-xs text-gray-500 mt-1">E-book</span>
        </Link>
        <Link href="/home" className="flex flex-col items-center p-2">
          <Home className="h-6 w-6 text-gray-900" />
          <span className="text-xs text-gray-900 mt-1">Beranda</span>
        </Link>
        <Link href="/profile" className="flex flex-col items-center p-2">
          <User className="h-6 w-6 text-gray-500" />
          <span className="text-xs text-gray-500 mt-1">Profil</span>
        </Link>
      </div>
    </nav>
  )
}
