"use client";
import { Menu } from "lucide-react";

export default function MobileHeader({ toggleSidebar }) {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b lg:hidden sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <button onClick={toggleSidebar} className="text-gray-700">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold text-green-700">PinenMFB</h1>
      </div>
      <div className="text-sm text-gray-600">Hi, Samuel 👋</div>
    </header>
  );
}
