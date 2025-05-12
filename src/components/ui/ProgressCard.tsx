import { Card, CardContent } from "~/components/ui/card"
import { Progress } from "~/components/ui/progress"
import { Lock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export interface ProgressCardProps {
    image: string // URL or placeholder
    title: string
    level: number
    progress: number
    status: "locked" | "unlocked"
    href?: string
}
  
export function ProgressCard({ image, title, level, progress, status, href }: ProgressCardProps) {
    const cardContent = (
        <Card className={`py-0 shadow-none ${status === "locked" ? "opacity-60" : "bg-[#E6F7F4] border-[#6DD0C3]"}`}>
        <CardContent className="p-4">
            <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center text-white mr-3 overflow-hidden">
                {image ? (
                <Image src={image} alt="icon" width={32} height={32} />
                ) : (
                <div className="bg-gray-200 w-full h-full" />
                )}
            </div>
            <div className="flex-1">
                <div className="flex gap-2 items-center mb-1">
                <div className="font-medium text-gray-900">{title}</div>
                <div className="text-sm text-gray-500">Lv {level}</div>
                </div>
                {status === "locked" ? (
                <div className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Locked</span>
                </div>
                ) : (
                <div className="flex flex-row justify-center items-center text-center gap-4">
                    <Progress value={progress} className="h-2 bg-white" />
                    <div className="text-right text-sm text-gray-500 mt-1">{progress}%</div>
                </div>
                )}
            </div>
            </div>
        </CardContent>
        </Card>
    );
    return href ? <Link href={href} className="block">{cardContent}</Link> : cardContent;
}

export interface LearningProgressProps {
    progressItems: ProgressCardProps[]
}