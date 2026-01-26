export function getApiKey(): string {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "BUTTONDOWN_API_KEY environment variable is required. " +
        "Get your API key from https://buttondown.com/settings/api"
    );
  }
  return apiKey;
}

export function jsonResponse(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}
