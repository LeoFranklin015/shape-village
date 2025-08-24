export async function fetchSubgraphData() {
  const url =
    "https://subgraph.satsuma-prod.com/d928402980bf/leo-franklin-johns-team--150303/example-subgraph-name/version/v0.0.3/api";

  const query = `
    {
  villages(where : {charactersCount_gte:2}) {
    id,
   villageId,
    creator,
    owner,
    metadataURI,
    createdAt,
    updatedAt,
    charactersCount
    characters{
      id,
      name,
      parents,
      charMetadata
    }
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

    const result: any = await response.json();
    console.log(result.data.villages[0].characters);
    return result.data.villages;
  } catch (error) {
    console.error("Error fetching subgraph meta:", error);
    throw error;
  }
}

fetchSubgraphData();
