import { SUBGRAPH_URL } from "./const";

export async function fetchSubgraphMeta(address: string) {
  const url = SUBGRAPH_URL;

  const query = `
    {
  villages(where:{owner :"${address}"}) {
    id,
   villageId,
    creator,
    owner,
    metadataURI,
    createdAt,
    updatedAt,
    charactersCount
  }
}
  `;

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
    console.log(result.data.villages);
    return result.data.villages;
  } catch (error) {
    console.error("Error fetching subgraph meta:", error);
    throw error;
  }
}
