import { Card, CardContent } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"

interface ProgressItem {
  title: string
  level: number
  progress: number
  icon: string
}

interface LearningProgressProps {
  progressItems: ProgressItem[]
}

function ProgressItem({ title, level, progress, icon }: ProgressItem) {
  return (
    <Card className="bg-[#E6F7F4] border-[#6DD0C3] py-0">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-[#4CD6C1] rounded-md flex items-center justify-center text-white mr-3">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex gap-2 items-center mb-1">
              <div className="font-medium">{title}</div>
              <div className="text-sm text-gray-500">Lv {level}</div>
            </div>
            <div className="flex flex-row justify-center items-center text-center gap-4">
              <Progress value={progress} className="h-2 bg-white" />
              <div className="text-right text-sm text-gray-500 mt-1">{progress}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LearningProgress({ progressItems }: LearningProgressProps) {
  return (
    <div className="space-y-3">
      {progressItems.map((item, index) => (
        <ProgressItem key={index} title={item.title} level={item.level} progress={item.progress} icon={item.icon} />
      ))}
    </div>
  )
}
