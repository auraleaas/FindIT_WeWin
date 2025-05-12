import { Card, CardContent } from "~/components/ui/card"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LearningOptionItem {
  title: string
  subtitle: string
  icon: string
  color: string
  href: string
}

interface LearningOptionsProps {
  options: LearningOptionItem[]
}

function LearningOption({ title, subtitle, icon, color, href }: LearningOptionItem) {
  return (
    <Link href={href} className="block">
      <Card className="bg-[#FFD966] border-none py-0 shadow-none">
        <CardContent className="px-3 py-2">
          <div className="flex flex-row items-center h-full gap-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 mb-0.5">{title === "Character" ? (subtitle === "Latin" ? "Character Latin" : "Character Braille") : title === "Number" ? (subtitle === "Latin" ? "Number Latin" : "Number Braille") : (subtitle === "Latin" ? "Word Latin" : "Word Braille")}</div>
              <div className="text-[8px] text-gray-500 mb-1">Learn now <ArrowRight className="inline ml-1 h-2 w-2" /></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-1">
                {/* Placeholder for icon/image */}
                <span className="text-lg font-bold text-[#4CD6C1]">{icon}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function LearningOptions({ options }: LearningOptionsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option, index) => (
        <LearningOption
          key={index}
          title={option.title}
          subtitle={option.subtitle}
          icon={option.icon}
          color={option.color}
          href={option.href}
        />
      ))}
    </div>
  )
}
