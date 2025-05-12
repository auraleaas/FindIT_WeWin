import Image from "next/image"

interface HomeHeaderProps {
  name: string
  message: string
}

export default function HomeHeader({ name, message }: HomeHeaderProps) {
  return (
    <header className="relative bg-[#4CD6C1] text-white p-6 pt-12 pb-12">
      <div className="flex items-start">
        <div className="flex-1">
          <h1 className="text-2xl font-medium mb-1">Hello, {name}!</h1>
          <p className="text-sm opacity-90 max-w-1/2">{message}</p>
        </div>
      </div>
    </header>
  )
}
