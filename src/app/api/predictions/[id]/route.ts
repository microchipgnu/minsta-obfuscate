// 1. explain image
// 2. generate image with explanation

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const response = await fetch(
    "https://api.replicate.com/v1/predictions/" + id,
    {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }
  );

  if (response.status !== 200 && response.status !== 201) {
    let error = await response.json();
    console.log(error);

    return Response.json({ error: error.detail }, { status: 500 });
  }

  try {
    const prediction = await response.json();
    return Response.json(prediction, { status: 200 });
  } catch (error) {
    console.error("Error converting image to blob:", error);

    return Response.json({ error: error });
  }
}
