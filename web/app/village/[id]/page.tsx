"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAccount } from "wagmi";
import { fetchVillageData } from "@/lib/getVillageData";
import Image from "next/image";
import { client, walletClient } from "@/lib/client";
import { VILLAGE_ABI } from "@/lib/const";
import VillageCharacter from "@/components/VillageCharacter";

const VillageDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = React.use(params);
  const { address } = useAccount();
  const [villageData, setVillageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [isCreatingCharacter, setIsCreatingCharacter] = useState(false);
  const [showHammer, setShowHammer] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [characterPositions, setCharacterPositions] = useState<any[]>([]);

  const fetchVillageDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchVillageData(id);
      console.log("Village data:", data);
      setVillageData(data);
    } catch (err) {
      console.error("Error fetching village data:", err);
      setError("Failed to fetch village data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVillageDetails();
  }, [id]);

  // Animation effect for character positions
  useEffect(() => {
    if (!villageData?.characters || villageData.characters.length < 2) return;

    // Initialize character positions across the full wander area
    const initialPositions = villageData.characters.map(
      (character: any, index: number) => ({
        id: character.id,
        x: 50 + ((index * 150) % 600), // Spread across full width
        y: 50 + Math.floor((index * 150) / 600) * 150, // Distribute vertically
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 0.5 + Math.random() * 1,
        verticalDirection: Math.random() > 0.5 ? 1 : -1,
        verticalSpeed: 0.3 + Math.random() * 0.7,
      })
    );

    setCharacterPositions(initialPositions);

    // Animation loop
    const animationInterval = setInterval(() => {
      setCharacterPositions((prev) =>
        prev.map((pos) => {
          let newX = pos.x + pos.speed * pos.direction;
          let newY = pos.y + pos.verticalSpeed * pos.verticalDirection;

          // Bounce off horizontal boundaries (use full width)
          if (newX <= 30 || newX >= 570) {
            pos.direction *= -1;
            newX = Math.max(30, Math.min(570, newX));
          }

          // Bounce off vertical boundaries (use full height)
          if (newY <= 30 || newY >= 570) {
            pos.verticalDirection *= -1;
            newY = Math.max(30, Math.min(570, newY));
          }

          // Add some random movement variation
          if (Math.random() < 0.01) {
            pos.speed = Math.max(
              0.3,
              Math.min(1.5, pos.speed + (Math.random() - 0.5) * 0.2)
            );
          }

          return {
            ...pos,
            x: newX,
            y: newY,
          };
        })
      );
    }, 100);

    return () => clearInterval(animationInterval);
  }, [villageData?.characters]);

  const handleCreateCharacter = async () => {
    if (!characterName.trim() || !characterDescription.trim() || !address) {
      return;
    }

    setIsCreatingCharacter(true);
    setShowHammer(true);

    try {
      // Call the character generation API
      const response = await fetch("/api/generate-character", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: characterName,
          characterDescription: characterDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate character");
      }

      console.log("Generated character data:", data);

      // Contract Call

      const tx = await walletClient?.writeContract({
        address: id as `0x${string}`,
        abi: VILLAGE_ABI,
        functionName: "addCharacter",
        args: [
          data.metadata.name,
          data.metadata.name,
          JSON.stringify(data.metadata),
          [
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
          ],
        ],
        account: address as `0x${string}`,
      });

      console.log("Transaction:", tx);

      await client.waitForTransactionReceipt({
        hash: tx as `0x${string}`,
      });

      await fetchVillageDetails();

      // TODO: Here you would typically:
      // 1. Deploy the character NFT to the blockchain
      // 2. Update the village's character count
      // 3. Refresh the village data

      // Close modal and reset form
      setIsCharacterModalOpen(false);
      setCharacterName("");
      setCharacterDescription("");

      // TODO: Refresh village data to update character count
      // await fetchVillageDetails();
    } catch (err) {
      console.error("Error creating character:", err);
      setError("Failed to create character");
    } finally {
      setIsCreatingCharacter(false);
      setShowHammer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#B9EAFD] to-[#F3FAFF]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl text-gray-400">⚙️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading village...
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch the village details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#B9EAFD] to-[#F3FAFF]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl text-red-400">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">
              Error loading village
            </h3>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#B9EAFD] to-[#F3FAFF]">
      {/* Header */}
      <Navbar />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {villageData ? (
          <div className="space-y-6">
            {parseInt(villageData.charactersCount) == 1 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Village Character
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#5CA4A3]">
                    {(() => {
                      try {
                        const character = villageData.characters[0];
                        const charMetadata = JSON.parse(character.charMetadata);
                        return (
                          <Image
                            src={charMetadata.image}
                            alt={character.name}
                            fill
                            className="object-cover"
                            priority
                          />
                        );
                      } catch (error) {
                        return (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">?</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {villageData.characters[0]?.name || "Unknown Character"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {villageData.characters[0]?.charMetadata?.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Character Growth Section */}
            {parseInt(villageData.charactersCount) < 2 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Village Needs to Grow!
                </h3>
                <p className="text-yellow-700 mb-4">
                  You need at least 2 characters for your village to flourish
                  and grow.
                </p>
                <button
                  onClick={() => setIsCharacterModalOpen(true)}
                  className="bg-[#5CA4A3] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5CA4A3]/90 transition-colors duration-200 shadow-lg"
                >
                  Create Character
                </button>
              </div>
            )}
            {parseInt(villageData.charactersCount) >= 2 && (
              <div className="flex justify-between items-center">
                <h1 className="game-text text-xl  text-[#5CA4A3] mb-4">
                  {JSON.parse(villageData.metadataURI).name}
                </h1>

                <div className="flex gap-4 items-center">
                  <button className="bg-[#5CA4A3] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5CA4A3]/90 transition-colors duration-200 shadow-lg">
                    BloodLine
                  </button>

                  {villageData.owner == address?.toLowerCase() && (
                    <button className="bg-[#5CA4A3] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#5CA4A3]/90 transition-colors duration-200 shadow-lg">
                      Sell Village
                    </button>
                  )}
                </div>
              </div>
            )}
            {/* Wander Component - Shows when 2+ characters */}
            {parseInt(villageData.charactersCount) >= 2 && (
              <div className="bg-white rounded-xl shadow-lg">
                <div className="h-screen relative overflow-hidden">
                  {/* Village Background Image */}
                  <div className="absolute inset-0">
                    {(() => {
                      try {
                        const villageMetadata = JSON.parse(
                          villageData.metadataURI
                        );
                        return (
                          <Image
                            src={"/Village.png"}
                            alt="Village Background"
                            fill
                            className="object-cover"
                            priority
                          />
                        );
                      } catch (error) {
                        return (
                          <div className="w-full h-full bg-gradient-to-br from-green-50 to-blue-50"></div>
                        );
                      }
                    })()}
                    {/* Overlay for better character visibility */}
                    <div className="absolute inset-0 bg-black/20"></div>
                  </div>

                  {/* Characters */}
                  {villageData.characters.map(
                    (character: any, index: number) => {
                      try {
                        const charMetadata = JSON.parse(character.charMetadata);
                        const position = characterPositions.find(
                          (pos) => pos.id === character.id
                        );

                        if (!position) return null;

                        return (
                          <VillageCharacter
                            key={character.id}
                            character={character}
                            position={position}
                            isSelected={selectedCharacter?.id === character.id}
                            onClick={() => setSelectedCharacter(character)}
                          />
                        );
                      } catch (error) {
                        return null;
                      }
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl text-gray-400">🏘️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No village data found
            </h3>
            <p className="text-gray-500">
              The village data could not be retrieved.
            </p>
          </div>
        )}
      </div>

      {/* Character Creation Modal */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsCharacterModalOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-gray-50 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#5CA4A3] text-white px-6 py-4">
              <h2 className="game-text text-2xl font-bold">
                Create a Character
              </h2>
              <p className="text-blue-100 mt-1">
                Give life to your village by creating a new character
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-white">
              <div className="space-y-6">
                {/* Character Name */}
                <div>
                  <label
                    htmlFor="characterName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Character Name
                  </label>
                  <input
                    id="characterName"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter your character's name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-gray-800 text-base"
                  />
                </div>

                {/* Character Description */}
                <div>
                  <label
                    htmlFor="characterDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Character Description
                  </label>
                  <textarea
                    id="characterDescription"
                    value={characterDescription}
                    onChange={(e) => setCharacterDescription(e.target.value)}
                    placeholder="Describe your character... What do they look like? What are their traits? What role do they play in the village?"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-gray-800 text-base leading-relaxed"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setIsCharacterModalOpen(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCharacter}
                  disabled={
                    isCreatingCharacter ||
                    !characterName.trim() ||
                    !characterDescription.trim()
                  }
                  className="px-6 py-3 bg-[#5CA4A3] text-white rounded-lg hover:bg-[#5CA4A3]/90 transition-all duration-200 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingCharacter ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    "Create Character"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Character Details Modal */}
      {selectedCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setSelectedCharacter(null)}
          ></div>

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-scroll border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#5CA4A3] text-white px-6 py-4">
              <h2 className="text-xl font-bold text-center">
                Character Details
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Character Image */}
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    {(() => {
                      try {
                        const charMetadata = JSON.parse(
                          selectedCharacter.charMetadata
                        );
                        return (
                          <Image
                            src={charMetadata.image}
                            alt={selectedCharacter.name}
                            width={96}
                            height={96}
                            className="rounded-full border-2 border-[#5CA4A3] object-cover"
                            priority
                          />
                        );
                      } catch (error) {
                        return (
                          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-sm">?</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

                {/* Character Info */}
                <div className="text-center">
                  <h3 className="font-bold text-gray-900 text-xl mb-2">
                    {selectedCharacter.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {(() => {
                      try {
                        const charMetadata = JSON.parse(
                          selectedCharacter.charMetadata
                        );
                        return charMetadata.description;
                      } catch (error) {
                        return "Description not available";
                      }
                    })()}
                  </p>
                </div>

                {/* Character Attributes */}
                {(() => {
                  try {
                    const charMetadata = JSON.parse(
                      selectedCharacter.charMetadata
                    );
                    if (
                      charMetadata.attributes &&
                      charMetadata.attributes.length > 0
                    ) {
                      return (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 text-center">
                            Attributes
                          </h4>
                          <div className="space-y-2">
                            {charMetadata.attributes.map(
                              (attr: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg"
                                >
                                  <span className="text-gray-600 font-medium">
                                    {attr.trait_type}:
                                  </span>
                                  <span className="text-gray-900 font-semibold">
                                    {attr.value}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch (error) {
                    return null;
                  }
                })()}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-center mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hammer Animation Overlay */}
      {showHammer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="relative">
            <Image
              src="/hammer.gif"
              alt="Hammer Animation"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
            <div className="text-black text-xl font-bold game-text px-4 py-2 rounded-lg">
              Creating Character...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VillageDetailPage;
