const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const runPrediction = async ({
  type,
  extra,
}: {
  type: string;
  extra: any;
}) => {
  try {
    const response = await fetch("/api/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        extra,
      }),
    });
    let prediction = await response.json();
    if (response.status !== 201) {
      throw new Error("Failed to start prediction");
    }

    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed"
    ) {
      await sleep(2000);
      const response = await fetch("/api/predictions/" + prediction.id, {
        cache: "no-store",
      });
      prediction = await response.json();
      if (response.status !== 200) {
        throw new Error("Failed to get prediction status");
      }
    }

    return prediction;
  } catch (error) {
    console.error("Prediction Error:", error);
    throw error; // Re-throw the error if you want calling function to know
  }
};


export async function fetchImageAndConvertToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}