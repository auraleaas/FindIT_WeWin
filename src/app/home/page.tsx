import type { Metadata } from "next"
import HomeHeader from "~/components/home/HomeHeader"
import LearningOptions from "~/components/home/LearningOptions"
import LearningProgress from "~/components/home/LearningProgress"
import LatinCharacter from "~/../public/images/latin-character.svg"

export const metadata: Metadata = {
  title: "Learning App - Home",
  description: "Learn Latin and Braille characters and numbers",
}

// Constants for the home page
const USER_DATA = {
  name: "John",
  message: "What do you want to learn today?",
}

const LEARNING_OPTIONS = [
  { title: "Character", subtitle: "Latin", icon: "abc", color: "#FFD966", href: "/module/latin" },
  { title: "Character", subtitle: "Braille", icon: "⠁", color: "#FFD966", href: "/module/braille" },
  { title: "Number", subtitle: "Latin", icon: "123", color: "#FFD966", href: "/module/latin-numbers" },
  { title: "Number", subtitle: "Braille", icon: "⠿", color: "#FFD966", href: "/module/braille-numbers" },
  { title: "Word", subtitle: "Latin", icon: "aku", color: "#FFD966", href: "/module/latin-words" },
  { title: "Word", subtitle: "Braille", icon: "⠃⠗", color: "#FFD966", href: "/module/braille-words" },
]

const PROGRESS_ITEMS = [
  { image: LatinCharacter, title: "Huruf Latin", level: 10, progress: 80, status: "unlocked" as const, href: "/module/latin" },
  { image: LatinCharacter, title: "Huruf Braille", level: 3, progress: 20, status: "locked" as const, href: "/module/braille" },
  { image: LatinCharacter, title: "Angka Latin", level: 5, progress: 50, status: "unlocked" as const, href: "/module/latin-numbers" },
  { image: LatinCharacter, title: "Angka Braille", level: 1, progress: 0, status: "locked" as const, href: "/module/braille-numbers" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#4CD6C1]">
      <HomeHeader name={USER_DATA.name} message={USER_DATA.message} />

      <main className="flex-1 px-4 pb-20 rounded-t-3xl bg-white">
        <section className="mt-4">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Learning Modules</h2>
          <LearningOptions options={LEARNING_OPTIONS} />
        </section>

        <section className="my-8">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Learning Progress</h2>
          <LearningProgress progressItems={PROGRESS_ITEMS} />
        </section>
      </main>
    </div>
  )
}
