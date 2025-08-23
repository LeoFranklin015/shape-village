import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { characterDescription, name } = await request.json();

    if (!characterDescription) {
      return NextResponse.json(
        { error: "Character description is required" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
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
                   Description: ${characterDescription}`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error("OpenAI Image API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0].url;

    // Generate ERC721 Metadata using GPT
    const metadataResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a creative NFT metadata generator. Generate ERC721-compliant metadata for a character NFT. Return JSON with this structure: { name: ${name}, description: string, image: string, attributes: [{ trait_type: string, value: string }] }`,
            },
            {
              role: "user",
              content: `Generate NFT metadata for this character: ${characterDescription}. The image URL is ${imageUrl}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 600,
        }),
      }
    );

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json();
      console.error("OpenAI Chat API Error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate metadata" },
        { status: 500 }
      );
    }

    const metadataData = await metadataResponse.json();
    let metadata;

    try {
      const content = metadataData.choices[0].message.content;
      metadata = JSON.parse(content);
    } catch (parseError) {
      // fallback metadata if GPT doesn't return valid JSON
      metadata = {
        name: "Generated Character",
        description: characterDescription,
        image: imageUrl,
        attributes: [
          { trait_type: "Background", value: "Fantasy" },
          { trait_type: "Rarity", value: "Unique" },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error) {
    console.error("Error generating character NFT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
