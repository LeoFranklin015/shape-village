import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export async function POST(request: NextRequest) {
  try {
    const { characterDescription, name } = await request.json();

    if (!characterDescription) {
      return NextResponse.json(
        { error: "Character description is required" },
        { status: 400 }
      );
    }

    // Check if Pinata JWT is configured
    const pinataJwt = process.env.PINATA_JWT;
    if (!pinataJwt) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway:
        process.env.GATEWAY_URL || "orange-select-opossum-767.mypinata.cloud",
    });

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

    const openaiImageUrl = imageData.data[0].url;

    // Download the generated image
    console.log("Downloading image from OpenAI:", openaiImageUrl);
    const imageDownloadResponse = await fetch(openaiImageUrl);

    if (!imageDownloadResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    // Convert the image to a File object for Pinata upload
    const imageBuffer = await imageDownloadResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });
    const imageFile = new File([imageBlob], `village-${Date.now()}.png`, {
      type: "image/png",
    });

    // Upload image to Pinata
    console.log("Uploading image to Pinata...");
    const pinataUpload = await pinata.upload.public.file(imageFile);
    console.log("Pinata upload successful:", pinataUpload);

    // Get the IPFS hash from the upload response
    const ipfsHash = pinataUpload.cid;
    if (!ipfsHash) {
      throw new Error("Failed to get IPFS hash from Pinata upload");
    }

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
              content: `Generate NFT metadata for this character: ${characterDescription}. The image URL is https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
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
