// 1. explain image
// 2. generate image with explanation

const predictions = {
  "llava-13b": {
    version: "2facb4a474a0462c15041b78b1ad70952ea46b5ec6ad29583c0b29dbd4249591",
  },
  sdxl: {
    version: "c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
  },
  "fofr/sdxl-emoji": {
    version: "dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
  },
  "sdxl-polaroid": {
    version: "3b4f77682527aa7da097ceff930d25edd4029c8b3a2e0f5226ceff6755395267",
  },
};

export async function POST(request: Request) {
  const body = await request.json();
  const { type, extra } = body as { type: "llava-13b" | "sdxl"; extra: any };

  let input;
  if (type === "llava-13b") {
    input = {
      prompt: extra.prompt,
      image: extra.image,
    };
  } else if (type === "sdxl") {
    input = {
      prompt: extra.prompt,
    };
  } else if (type === "fofr/sdxl-emoji") {
    input = {
      prompt: extra.prompt,
      image: extra.image,
    };
  } else if (type === "sdxl-polaroid") {
    input = {
      prompt: extra.prompt,
      image: extra.image,
      negative_prompt: extra.negative_prompt,
    };
  }

  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // Pinned to a specific version of Stable Diffusion
      // See https://replicate.com/stability-ai/sdxl
      version: predictions[type].version || "",
      input: input,
    }),
  });

  if (response.status !== 201) {
    let error = await response.json();
    return Response.json({ error: error.detail }, { status: 500 });
  }

  try {
    const prediction = await response.json();
    return Response.json(prediction, { status: 201 });
  } catch (error) {
    console.error("Error converting image to blob:", error);
    return Response.json({ error: error });
  }
}
