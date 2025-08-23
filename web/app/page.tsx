"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function IntroScreen() {
  const router = useRouter();
  const [showStart, setShowStart] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        router.push(`/wander`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* New background with Berlin skyline and RETRO WANDER title */}
      <div className="absolute inset-0 z-0 bg-[#001428] pixelated">
        <Image
          src="/Bg.gif"
          alt="Berlin Skyline"
          fill
          className="object-cover pixelated"
          priority
        />
      </div>

      <div className="z-10 flex flex-col items-center justify-center w-full">
        <div
          className={`game-text text-white text-2xl text-center w-full ${
            showStart ? "blink" : ""
          }`}
        >
          Press ENTER to Start
        </div>
      </div>
    </div>
  );
}
