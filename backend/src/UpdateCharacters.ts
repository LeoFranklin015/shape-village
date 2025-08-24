import { fetchSubgraphData } from "./getVillages";
// @ts-ignore - Pinata module import
import { PinataSDK } from "pinata";

import { VILLAGE_ABI } from "./abi";
dotenv.config();
import {
  createPublicClient,
  createWalletClient,
  http,
  type WalletClient,
} from "viem";

import { shapeSepolia } from "viem/chains";
import dotenv from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { client } from "./client";

interface Character {
  id: string;
  name: string;
  parents: string[];
  charMetadata: string;
}

interface Village {
  id: string;
  villageId: string;
  creator: string;
  owner: string;
  metadataURI: string;
  createdAt: string;
  updatedAt: string;
  charactersCount: string;
  characters: Character[];
}

interface OpenAIImageResponse {
  data: Array<{
    url: string;
  }>;
}

const generateChildImage = async (
  childDescription: string,
  childName: string
) => {
  try {
    // Check if OpenAI API key is configured
    const openaiApiKey = process.env["OPENAI_API_KEY"];
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Generate NFT-style character image using DALL·E
    const imageResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Create a detailed, NFT-style avatar of a unique character. 

                   Make it like a PFP NFT. Dont add too artificial colors and images
                   Keep it simple , Keep it in 8bits style . PFP of a character.
                   The NFT must Only contain the Object , No other details to be written or shown
                   Description: ${childDescription}
                   
                   STRICTLY ONLY PFP -> only the NFT character no more workds in the image
                   `,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error("OpenAI Image API Error:", errorData);
      throw new Error("Failed to generate image");
    }

    const imageData = (await imageResponse.json()) as OpenAIImageResponse;
    const openaiImageUrl = imageData.data[0]?.url;

    if (!openaiImageUrl) {
      throw new Error("No image URL received from OpenAI");
    }

    // Download the generated image
    console.log("Downloading child image from OpenAI:", openaiImageUrl);
    const imageDownloadResponse = await fetch(openaiImageUrl);

    if (!imageDownloadResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    // Convert the image to a File object for Pinata upload
    const imageBuffer = await imageDownloadResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });
    const imageFile = new File(
      [imageBlob],
      `child-${childName}-${Date.now()}.png`,
      {
        type: "image/png",
      }
    );

    // Check if Pinata JWT is configured
    const pinataJwt = process.env["PINATA_JWT"];
    if (!pinataJwt) {
      throw new Error("Pinata JWT not configured");
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway:
        process.env["GATEWAY_URL"] ||
        "orange-select-opossum-767.mypinata.cloud",
    });

    // Upload image to Pinata
    console.log("Uploading child image to Pinata...");
    const pinataUpload = await pinata.upload.public.file(imageFile);
    console.log("Pinata upload successful:", pinataUpload);

    // Get the IPFS hash from the upload response
    const ipfsHash = pinataUpload.cid;
    if (!ipfsHash) {
      throw new Error("Failed to get IPFS hash from Pinata upload");
    }

    return ipfsHash;
  } catch (error) {
    console.error("Error generating child image:", error);
    return null;
  }
};

const generateChildMetadata = async (
  villageDesc: String,
  parent1: Character,
  parent2: Character
) => {
  try {
    // Parse parent metadata
    const parent1Meta = JSON.parse(parent1.charMetadata);
    const parent2Meta = JSON.parse(parent2.charMetadata);

    // Create a prompt for the child based on parents
    const prompt = `Generate metadata for a new character who is the child of two existing characters and where there live in:

Parent 1: ${parent1Meta.name} - ${parent1Meta.description}
Parent 1 Attributes: ${parent1Meta.attributes
      ?.map((attr: any) => `${attr.trait_type}: ${attr.value}`)
      .join(", ")}

Parent 2: ${parent2Meta.name} - ${parent2Meta.description}
Parent 2 Attributes: ${parent2Meta.attributes
      ?.map((attr: any) => `${attr.trait_type}: ${attr.value}`)
      .join(", ")}

Village Description: ${villageDesc}. T

Create a unique child character that combines traits from both parents while being distinct. Return JSON with this structure:
{
  "name": "Child's Name",
  "description": "Detailed description of the child character",
  "attributes": [
    {"trait_type": "Heritage", "value": "Mixed"},
    {"trait_type": "Personality", "value": "Combined trait from parents"},
    {"trait_type": "Skills", "value": "Inherited abilities"},
    {"trait_type": "Appearance", "value": "Physical description"},etc...
  ]
}`;

    // Call OpenAI API to generate child metadata
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["OPENAI_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a creative character designer. Generate unique character metadata for a child based on their parents' traits and characteristics.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices[0].message.content;

    // Parse the generated metadata
    let childMetadata;
    try {
      childMetadata = JSON.parse(content);
    } catch (parseError) {
      // Fallback metadata if parsing fails
      childMetadata = {
        name: `${parent1Meta.name} & ${parent2Meta.name}'s Child`,
        description: `A unique character born from the union of ${parent1Meta.name} and ${parent2Meta.name}, combining the best traits of both parents.`,
        attributes: [
          { trait_type: "Heritage", value: "Mixed" },
          { trait_type: "Parent1", value: parent1Meta.name },
          { trait_type: "Parent2", value: parent2Meta.name },
          { trait_type: "Generation", value: "Child" },
        ],
      };
    }

    // Generate image for the child character
    console.log("🎨 Generating child character image...");
    const childImageHash = await generateChildImage(
      childMetadata.description,
      childMetadata.name
    );

    if (childImageHash) {
      childMetadata.image = `https://gateway.pinata.cloud/ipfs/${childImageHash}`;
      console.log(`   🖼️  Child image uploaded to IPFS: ${childImageHash}`);
    } else {
      console.log("   ⚠️  Failed to generate child image, using placeholder");
      childMetadata.image = "ipfs://placeholder";
    }

    return childMetadata;
  } catch (error) {
    console.error("Error generating child metadata:", error);
    return null;
  }
};

export const discoverNewCharacters = async () => {
  try {
    console.log("🔍 Starting character discovery process...");

    // Fetch all villages and their characters
    const villages = await fetchSubgraphData();
    console.log(`📊 Found ${villages.length} villages`);

    let totalCharacters = 0;
    let discoveredCharacters = 0;

    for (const village of villages) {
      console.log(`\n🏘️ Processing village: ${village.villageId}`);
      console.log(`   Characters in village: ${village.charactersCount}`);

      if (parseInt(village.charactersCount) < 2) {
        console.log(`   ⚠️  Village needs at least 2 characters for discovery`);
        continue;
      }

      totalCharacters += parseInt(village.charactersCount);

      // Randomly select 2 characters from this village
      const characters = village.characters;
      if (characters.length < 2) continue;

      // Shuffle characters and pick 2
      const shuffled = [...characters].sort(() => Math.random() - 0.5);
      const selectedPair = shuffled.slice(0, 2);

      console.log(`   🎯 Selected character pair:`);
      console.log(`      - ${selectedPair[0].name} (${selectedPair[0].id})`);
      console.log(`      - ${selectedPair[1].name} (${selectedPair[1].id})`);

      // Generate child metadata
      console.log(`   👶 Generating child metadata...`);
      const childMetadata = await generateChildMetadata(
        JSON.parse(village.metadataURI).description,
        selectedPair[0],
        selectedPair[1]
      );

      if (childMetadata) {
        console.log(`   ✅ Child generated successfully:`);
        console.log(`      Name: ${childMetadata.name}`);
        console.log(
          `      Description: ${childMetadata.description.substring(0, 100)}...`
        );
        console.log(
          `      Attributes: ${childMetadata.attributes?.length || 0} traits`
        );

        discoveredCharacters++;
        console.log(
          `   🔗 Child metadata:`,
          JSON.stringify(childMetadata, null, 2)
        );

        // Create the character onchain.

        const walletClient: WalletClient = createWalletClient({
          chain: shapeSepolia,
          transport: http((process.env["SHAPE_SEPOLIA_URL"] as string) || ""),
          account: privateKeyToAccount(
            process.env["PRIVATE_KEY"] as `0x${string}`
          ),
        });

        const tx = await walletClient.writeContract({
          chain: shapeSepolia,
          account: privateKeyToAccount(
            process.env["PRIVATE_KEY"] as `0x${string}`
          ),
          address: village.id as `0x${string}`,
          abi: VILLAGE_ABI,
          functionName: "addCharacter",
          args: [
            childMetadata.name,
            childMetadata.name,
            JSON.stringify(childMetadata),
            [selectedPair[0].id, selectedPair[1].id],
          ],
        });

        console.log(tx);

        await client.waitForTransactionReceipt({ hash: tx });
      } else {
        console.log(`   ❌ Failed to generate child metadata`);
      }

      // Add a small delay between villages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n🎉 Character discovery complete!`);
    console.log(`📈 Total characters processed: ${totalCharacters}`);
    console.log(`👶 New characters discovered: ${discoveredCharacters}`);
  } catch (error) {
    console.error("❌ Error in character discovery:", error);
  }
};

export const updateCharacters = async () => {
  await discoverNewCharacters();
};

// Run the discovery process
if (require.main === module) {
  discoverNewCharacters();
}
