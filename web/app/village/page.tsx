"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { client, walletClient } from "@/lib/client";
import {
  VILLAGE_FACTORY_ABI,
  VILLAGE_FACTORY_CONTRACT_ADDRESS,
} from "@/lib/const";
import { useAccount } from "wagmi";

export default function VillagePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [villageDescription, setVillageDescription] = useState("");
  const [showHammer, setShowHammer] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVillage, setGeneratedVillage] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const generateVillage = async (description: string) => {
    if (!description.trim()) {
      setError("Please provide a village description");
      return null;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVillage(null);

    try {
      const response = await fetch("/api/generate-village", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ villageDescription: description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate village");
      }

      setGeneratedVillage(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setGeneratedVillage(null);
    setError(null);
    setIsGenerating(false);
  };

  const handleCreateVillage = async () => {
    if (!villageDescription.trim() || !address) {
      return;
    }
    setShowHammer(true);

    // const result = await generateVillage(villageDescription);
    // if (result) {
    //   // Merge image URL into metadata and print complete data
    //   const completeVillageData = {
    //     ...result.metadata,
    //     imageUrl: result.imageUrl,
    //   };

    //   console.log("Complete Village Data:", completeVillageData);

    const completeVillageData = {
      name: "Green Haven",
      description:
        "A serene, lush-green village with no houses in the centre but two well-maintained farmhouses situated in the corners.",
      attributes: {
        types: ["Rural"],
        culture: "Agrarian",
        resources: ["Vegetation", "Farmland"],
      },
      features: ["No central housing", "Two corner farmhouses"],
      imageUrl:
        "https://oaidalleapiprodscus.blob.core.windows.net/private/org-eNwqmSK4VURnx7crJShpR70R/user-7R6bXQRnfeUIT8AHHsmX6jlI/img-4Ju9efuqSW48sLJO5vBAZ9ce.png?st=2025-08-23T17%3A42%3A33Z&se=2025-08-23T19%3A42%3A33Z&sp=r&sv=2024-08-04&sr=b&rscd=inline&rsct=image/png&skoid=8b33a531-2df9-46a3-bc02-d4b1430a422c&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-08-23T18%3A42%3A33Z&ske=2025-08-24T18%3A42%3A33Z&sks=b&skv=2024-08-04&sig=Osovug5DeXMN5V/YwvAfJ6pgkjCDbho8LLpWlrTXE08%3D",
    };

    const tx = await walletClient?.writeContract({
      address: VILLAGE_FACTORY_CONTRACT_ADDRESS as `0x${string}`,
      abi: VILLAGE_FACTORY_ABI,
      functionName: "createVillage",
      args: [JSON.stringify(completeVillageData)],
      account: address as `0x${string}`,
    });

    await client.waitForTransactionReceipt({ hash: tx as `0x${string}` });
    setShowResults(true);
    setIsModalOpen(false);
    setShowHammer(false);

    // Auto-close the results modal after 3 seconds
    setTimeout(() => {
      setShowResults(false);
      reset();
      setVillageDescription("");
    }, 3000);
  };

  const clearError = () => {
    // Reset the error state from the hook
    reset();
  };

  const handleCloseResults = () => {
    setShowResults(false);
    reset();
    setVillageDescription("");
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-[#B9EAFD] to-[#F3FAFF]">
      {/* Header */}
      <Navbar />
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content will go here */}
        <div className="flex justify-between">
          <div className="flex items-center">
            <h1 className="game-text text-lg font-bold text-[#5CA4A3]">
              Village Center
            </h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-[#001428] px-6 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 shadow-lg"
          >
            <span className="text-lg">+</span>
            Create Village
          </button>
        </div>
      </div>

      {/* Create Village Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal */}
          <div className="relative bg-gray-50 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#5CA4A3] text-white px-6 py-4">
              <h2 className="game-text text-2xl font-bold">
                Create Your Village
              </h2>
              <p className="text-blue-100 mt-1">
                Describe how your village looks and what attributes it has
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 bg-white">
              <div className="mb-6">
                <label
                  htmlFor="villageDescription"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Village Description & Attributes
                </label>
                <textarea
                  id="villageDescription"
                  value={villageDescription}
                  onChange={(e) => setVillageDescription(e.target.value)}
                  placeholder="Describe your village... What does it look like? What are its unique features? What kind of atmosphere does it have? What are the main attributes and characteristics of your village?"
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans text-gray-800 text-base leading-relaxed bg-gray-50"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVillage}
                  disabled={isGenerating || !villageDescription.trim()}
                  className="px-6 py-3 bg-[#5CA4A3] text-white rounded-lg hover:bg-[#5CA4A3]/90 transition-all duration-200 font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    "Create Village"
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
              Building Village...
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResults && generatedVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={handleCloseResults}
          ></div>

          {/* Results Modal */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#5CA4A3] text-white px-6 py-4 sticky top-0">
              <h2 className="game-text text-2xl font-bold">
                Your Village: {generatedVillage.metadata.name}
              </h2>
              <p className="text-blue-100 mt-1">
                Generated with AI based on your description
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="flex justify-center">
                {/* Generated Image */}
                <div className="space-y-4 max-w-2xl">
                  <h3 className="text-lg font-semibold text-gray-900 text-center">
                    Your Village Has Been Created!
                  </h3>
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={generatedVillage.imageUrl}
                      alt={generatedVillage.metadata.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <p className="text-center text-gray-600">
                    Your village "{generatedVillage.metadata.name}" has been
                    successfully created and deployed to the blockchain!
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col items-center gap-3 mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                  This modal will automatically close in a few seconds...
                </p>
                <button
                  onClick={handleCloseResults}
                  className="px-6 py-3 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Close Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-white/80 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
