"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAccount } from "wagmi";
import { fetchVillageData } from "@/lib/getVillageData";
import Image from "next/image";
import { client, walletClient } from "@/lib/client";
import { VILLAGE_ABI } from "@/lib/const";

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
        {/* Village Header */}
        <div className="mb-8">
          <h1 className="game-text text-3xl font-bold text-[#5CA4A3] mb-2">
            Village Details
          </h1>
          <p className="text-gray-600">Village ID: {id}</p>
        </div>

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
