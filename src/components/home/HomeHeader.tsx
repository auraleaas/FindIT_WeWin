import Image from "next/image"
import LatinCharacter from "~/../public/images/latin-character.svg"

interface HomeHeaderProps {
  name: string
  message: string
}

export default function HomeHeader({ name, message }: HomeHeaderProps) {
  return (
    <header className="relative bg-[#4CD6C1] text-white p-6 pt-12 pb-8 rounded-b-3xl">
      <div className="flex items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-medium mb-1">Hello, {name}!</h1>
          <p className="text-sm opacity-90 max-w-3/4">What do you want to study today?</p>
        </div>
        <div className="ml-4">
          <Image src={LatinCharacter} alt="Illustration" width={80} height={80} className="rounded-full" />
        </div>
      </div>
    </header>
  )
}
