'use client';

import React from "react";
import BookCard from "~/components/e-book/BookCard";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import BackButton from "~/components/ui/BackButton";
import { FaSearch } from "react-icons/fa";

const BOOKS = [
  {
    image: "/images/e-book/Atomic-Habits.svg",
    title: "Atomic Habits",
    author: "James Clear",
    category: "Self-development",
  },
  {
    image: "/images/e-book/Stop-Ovt.svg",
    title: "Stop Overthinking",
    author: "Nick Trenton",
    category: "Self-development",
  },
  {
    image: "/images/e-book/7-Effecting.svg",
    title: "The 7 Habits",
    author: "Stephen R. Covey",
    category: "Self-development",
  },
  {
    image: "/images/e-book/Mindset.svg",
    title: "Mindset",
    author: "Dr Carlo S. Dweck",
    category: "Psychology",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(BOOKS.map(b => b.category)))];

export default function EbookPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All");

  const filteredBooks = BOOKS.filter(
    b =>
      (category === "All" || b.category === category) &&
      (b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-[#4CD6C1] px-4 pt-8 pb-4 flex items-center gap-2">
        <BackButton />
        <h1 className="text-lg font-medium text-white ml-2">Explore E-Books</h1>
      </div>
      <div className="px-4 pt-4">
        <div className="font-medium text-gray-800 mb-2">Books Available</div>
        <div className="relative mb-3">
          <Input
            placeholder="Search Books.."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-full text-sm border-[#4CD6C1] focus:ring-[#4CD6C1] w-full pr-10"
          />
          <FaSearch className="h-4 w-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="mb-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 rounded-full border-[#4CD6C1] bg-[#4cd6c130]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="font-semibold text-gray-800 mb-2">Best-Sellers</div>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {filteredBooks.map((book, idx) => (
            <BookCard key={idx} {...book} />
          ))}
        </div>
      </div>
    </div>
  );
}
