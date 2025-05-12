import type { Metadata } from "next"
import HomeHeader from "~/components/home/HomeHeader"
import LearningOptions from "~/components/home/LearningOptions"
import LearningProgress from "~/components/home/LearningProgress"
import Navbar from "~/components/layout/Navbar"

export const metadata: Metadata = {
  title: "Learning App - Home",
  description: "Learn Latin and Braille characters and numbers",
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#4CD6C1]">
      <HomeHeader name="John" message="What do you want to learn today?" />

      <main className="flex-1 px-4 pb-20 rounded-t-3xl bg-white">
        <section className="mt-4">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Learning Modules</h2>
          <LearningOptions />
        </section>

        <section className="my-8">
          <h2 className="text-xl font-medium text-gray-800 mb-3">Learning Progress</h2>
          <LearningProgress />
        </section>
      </main>

      <Navbar />
    </div>
  )
}
