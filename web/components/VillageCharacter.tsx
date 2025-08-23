import Image from "next/image";
import React from "react";

interface VillageCharacterProps {
  character: any;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}

const VillageCharacter: React.FC<VillageCharacterProps> = ({
  character,
  position,
  isSelected,
  onClick,
}) => {
  // Assign character sprite based on character ID (deterministic)
  // This ensures the same character always gets the same sprite
  const characterId = character.id;
  const spriteNumber = parseInt(characterId.slice(-1), 16) % 4; // Use last hex digit
  const spriteSrc =
    spriteNumber === 0 ? "/1.png" : spriteNumber === 1 ? "/2.png" : "/3.png";

  // Alternative: Random assignment (uncomment if you prefer random)
  // const spriteSrc = Math.random() > 0.5 ? "/1.png" : "/2.png";

  return (
    <div
      className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 10,
      }}
      onClick={onClick}
    >
      <div className="relative w-20 h-20">
        <Image
          src={spriteSrc}
          alt={character.name}
          width={80}
          height={80}
          className="rounded-full   object-cover"
          priority
        />
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#5CA4A3] rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      {/* Character name */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="bg-black/70 px-2 py-1 rounded text-xs game-text text-white whitespace-nowrap">
          {character.name}
        </div>
      </div>
    </div>
  );
};

export default VillageCharacter;
