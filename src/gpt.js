export async function fetchGPTQuestion() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Skriv ett sjukt 'antingen eller'-scenario för 18+.",
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices[0].message.content;
  const parts = text.split(/ eller /i);

  return {
    option1: parts[0]?.replace(/^antingen /i, "").trim() || "Alternativ 1",
    option2: parts[1]?.trim() || "Alternativ 2",
  };
}