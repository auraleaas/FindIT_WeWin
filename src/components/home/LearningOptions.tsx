import { Card, CardContent } from "~/components/ui/card"
import { ArrowRight } from "lucide-react"

interface LearningOptionItem {
  title: string
  subtitle: string
  icon: string
  color: string
}

interface LearningOptionsProps {
  options: LearningOptionItem[]
}

function LearningOption({ title, subtitle, icon, color }: LearningOptionItem) {
  return (
    <Card className="bg-[#FFD966] border-none py-2">
      <CardContent className="px-2 py-0">
        <div className="flex flex-col h-full">
          <div className="mb-1">
            <div className="text-md text-gray-700">{title}</div>
            <div className="text-xl font-medium text-gray-900">{subtitle}</div>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <button className="text-[8px] text-gray-700 flex items-center">
              Learn now <ArrowRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
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
        />
      ))}
    </div>
  )
}
