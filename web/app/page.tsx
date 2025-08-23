"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function IntroScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        router.push(`/village`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleGetStarted = () => {
    router.push(`/village`);
  };

  return (
    <div className="w-full h-screen flex overflow-hidden">
      {/* Background with Berlin skyline */}
      <div className="absolute inset-0 z-0 bg-[#001428] pixelated">
        <Image
          src="/hero.gif"
          alt="Berlin Skyline"
          fill
          className="object-cover pixelated"
          priority
        />
      </div>

      {/* Left side content */}
      <div className="z-10 flex-1 flex flex-col justify-end items-start p-10">
        <div className="max-w-md">
          <h1 className="game-text text-5xl font-bold text-white mb-4 leading-tight">
            ShapeVillage
          </h1>
          <p className="game-text text-md text-gray-300 mb-8 leading-relaxed">
            Start a village, watch life unfold.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-white text-[#001428] font-semibold text-lg rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
