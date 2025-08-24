import { fetchSubgraphData } from "./getVillages";
import dotenv from "dotenv";
dotenv.config();

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

    return childMetadata;
  } catch (error) {
    console.error("Error generating child metadata:", error);
    return null;
  }
};

const discoverNewCharacters = async () => {
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

        // Here you would typically:
        // 1. Deploy the child character NFT to the blockchain
        // 2. Update the village's character count
        // 3. Store the relationship between parents and child

        console.log(
          `   🔗 Child metadata:`,
          JSON.stringify(childMetadata, null, 2)
        );
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
