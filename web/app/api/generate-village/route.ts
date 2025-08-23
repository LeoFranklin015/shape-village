import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { villageDescription } = await request.json();

    if (!villageDescription) {
      return NextResponse.json(
        { error: "Village description is required" },
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

    // Generate image using DALL-E
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
          prompt: `Create a beautiful, detailed village image which could be used as a bg in the website. But always make sure you cerate all the buildings , materails in the corners.  In  middle part of the image leave some space for the NPC TO move around. 
           description: ${villageDescription}. `,
          n: 1,
          size: "1792x1024",
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
    console.log(imageData);
    const imageUrl = imageData.data[0].url;

    // Generate metadata using GPT-4
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
              content:
                "You are a creative village designer. Generate detailed metadata for a village based on the user's description. Return a JSON object with the following structure: { name: string, description: string, attributes: { types: string[] culture: string, resources: string[] }, features: string[] }",
            },
            {
              role: "user",
              content: `Generate metadata for this village: ${villageDescription}`,
            },
          ],
          temperature: 0.8,
          max_tokens: 1000,
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
      // Try to parse the JSON response
      const content = metadataData.choices[0].message.content;
      metadata = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, create a structured response from the text
      const content = metadataData.choices[0].message.content;
      metadata = {
        name: "Generated Village",
        description: content,
        attributes: {
          population: Math.floor(Math.random() * 1000) + 100,
          climate: "Temperate",
          terrain: "Mixed",
          culture: "Diverse",
          resources: ["Agriculture", "Crafts", "Trade"],
        },
        features: ["Town Square", "Market", "Houses"],
        atmosphere: "Welcoming and peaceful",
        size: "Medium",
      };
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      metadata,
    });
  } catch (error) {
    console.error("Error generating village:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
