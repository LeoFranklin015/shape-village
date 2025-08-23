import { SUBGRAPH_URL } from "./const";

export async function fetchVillageData(address: string) {
  const url = SUBGRAPH_URL;

  const query = `{
  village(id:"${address}") {
    id,
   villageId,
    creator,
    owner,
    metadataURI,
    createdAt,
    updatedAt,
    charactersCount,
    characters{
      id,
      name,
      parents,
      symbol,
      charMetadata
    }
  }
}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL query failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(result);
    console.log(result.data.village);
    return result.data.village;
  } catch (error) {
    console.error("Error fetching subgraph meta:", error);
    throw error;
  }
}
