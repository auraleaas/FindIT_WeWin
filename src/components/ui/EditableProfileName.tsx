'use client';
import React from "react";
import { FaRegEdit } from "react-icons/fa";

export default function EditableProfileName({ name }: { name: string }) {
  const [value, setValue] = React.useState(name);
  const [editing, setEditing] = React.useState(false);

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <input
          className="text-xl font-medium text-gray-900 bg-white rounded px-2 py-1 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#4CD6C1]"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={() => setEditing(false)}
          autoFocus
        />
      ) : (
        <span className="text-xl font-medium text-gray-900">{value}</span>
      )}
      <button onClick={() => setEditing(true)} className="ml-1 text-gray-500 hover:text-[#4CD6C1]">
        <FaRegEdit />
      </button>
    </div>
  );
}