import { ProgressCard } from "~/components/ui/ProgressCard";
import LatinCharacter from "~/../public/images/latin-character.svg";
import BackButton from "~/components/ui/BackButton";

const LEVELS = [
  { image: LatinCharacter, title: "Alphabet A", level: 1, progress: 100, status: "unlocked" as const, href: "/module/latin/level/1" },
  { image: LatinCharacter, title: "Alphabet B", level: 2, progress: 100, status: "unlocked" as const, href: "/module/latin/level/2" },
  { image: LatinCharacter, title: "Alphabet C", level: 3, progress: 80, status: "unlocked" as const, href: "/module/latin/level/3" },
  { image: LatinCharacter, title: "Alphabet D", level: 4, progress: 0, status: "locked" as const, href: "/module/latin/level/4" },
  { image: LatinCharacter, title: "Alphabet E", level: 5, progress: 0, status: "locked" as const, href: "/module/latin/level/5" },
  { image: LatinCharacter, title: "Alphabet F", level: 6, progress: 0, status: "locked" as const, href: "/module/latin/level/6" },
];

export default function ModulePage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-[#4CD6C1] px-4 pt-8 pb-4 flex items-center gap-2">
      <BackButton />
        <h1 className="text-lg font-medium text-white ml-2">Belajar Menulis</h1>
      </div>
      <div className="px-4 mt-6">
        <h2 className="text-2xl font-medium text-gray-900 mb-2">Huruf Latin</h2>
        <div className="text-lg font-medium text-gray-800 mb-2">Level</div>
        <div className="space-y-3">
          {LEVELS.map((item, idx) => (
            <ProgressCard key={idx} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
} 