import { ProgressCard } from "~/components/ui/ProgressCard";
import AchievementCard from "~/components/ui/AchievementCard";
import EditableProfileName from "~/components/ui/EditableProfileName";
import Image from "next/image";
import BackButton from "~/components/ui/BackButton";
import LatinCharacter from "~/../public/images/latin-character.svg";

const PROFILE = {
  name: "John Doe",
  joined: "January 2025",
  avatar: LatinCharacter,
  hours: 2,
  classes: 1,
  xp: 527,
};

const CLASSES = [
  {
    image: LatinCharacter,
    title: "Angka Latin",
    level: 2,
    progress: 100,
    status: "unlocked" as const,
  },
  {
    image: LatinCharacter,
    title: "Huruf Latin",
    level: 3,
    progress: 80,
    status: "unlocked" as const,
  },
];

const AWARDS = [
  {
    image: "/images/achievement.svg",
    title: "Ambisius",
    desc: "Anda telah menyelesaikan 2 kelas belajar",
    star: 3,
    color: "#4CB6F6",
  },
  {
    image: "/images/achievement.svg",
    title: "Perfeksionis",
    desc: "Anda telah menyelesaikan kuis",
    star: 2,
    color: "#A98DF6",
  },
];

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-[#4CD6C1] px-4 pt-8 pb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-lg font-medium text-white ml-2">Profil</h1>
      </div>
      <div className="px-4 pt-4">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden">
            <Image src={PROFILE.avatar} alt="Profile" width={96} height={96} />
          </div>
          <div className="flex-1">
            <EditableProfileName name={PROFILE.name} />
            <div className="text-xs text-gray-500">Joined {PROFILE.joined}</div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-6 bg-white rounded-2xl px-6 py-4">
          <div className="flex flex-col items-center">
            <span className="font-medium text-lg text-gray-900">2+ hours</span>
            <span className="text-xs text-gray-500">Learned</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="font-medium text-lg text-gray-900">1</span>
            <span className="text-xs text-gray-500">Class</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="font-medium text-lg text-yellow-400 flex items-center gap-1">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.77 7.82 20 9 12.91l-5-3.64 5.91-.91z"/></svg>
              {PROFILE.xp}
            </span>
            <span className="text-xs text-gray-500">XP Earned</span>
          </div>
        </div>
        <div className="mt-8">
          <div className="font-semibold text-gray-800 mb-2">Class Joined</div>
          <div className="space-y-3">
            {CLASSES.map((item, idx) => (
              <ProgressCard key={idx} {...item} />
            ))}
          </div>
        </div>
        <div className="my-8">
          <div className="font-semibold text-gray-800 mb-2">Achievements</div>
          <div className="space-y-3">
            {AWARDS.map((item, idx) => (
              <AchievementCard key={idx} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}