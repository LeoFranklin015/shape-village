import { useState } from "react";
import { VillageGenerationResponse, VillageGenerationError } from "@/lib/types";

export const useVillageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVillage, setGeneratedVillage] =
    useState<VillageGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return {
    generateVillage,
    isGenerating,
    generatedVillage,
    error,
    reset,
  };
};
