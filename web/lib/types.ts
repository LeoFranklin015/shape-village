export interface VillageAttributes {
  population: number;
  climate: string;
  terrain: string;
  culture: string;
  resources: string[];
}

export interface VillageMetadata {
  name: string;
  description: string;
  attributes: VillageAttributes;
  features: string[];
  atmosphere: string;
  size: string;
}

export interface VillageGenerationResponse {
  success: boolean;
  imageUrl: string;
  metadata: VillageMetadata;
}

export interface VillageGenerationError {
  error: string;
}

