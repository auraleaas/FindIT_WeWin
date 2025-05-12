import { ProgressCard, type LearningProgressProps } from "~/components/ui/ProgressCard"

export default function LearningProgress({ progressItems }: LearningProgressProps) {
  return (
    <div className="space-y-3">
      {progressItems.map((item, index) => (
        <ProgressCard key={index} {...item} />
      ))}
    </div>
  )
}
