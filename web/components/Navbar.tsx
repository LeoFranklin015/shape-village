import React from "react";
import { CustomConnectButton } from "./ConnectButton";
import Link from "next/link";

const Navbar = () => {
  return (
    <div className="bg-black/10 backdrop-blur-sm p-2 rounded-full max-w-6xl mx-auto mt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Village title */}
          <div className="flex items-center space-x-6">
            <h1 className="game-text text-xl font-bold text-white">
              ShapeVillage
            </h1>
          </div>

          {/* Right side - Create Village button */}
          <div className="flex items-center space-x-4">
            <Link
              href="/village"
              className="game-text text-sm text-white/80 hover:text-white transition-colors duration-200 font-medium"
            >
              Villages
            </Link>
            <CustomConnectButton />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
