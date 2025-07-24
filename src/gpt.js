import axios from "axios";

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export async function fetchGPTQuestion() {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content:
              "Skapa ett mörkt, grovt eller provocerande 'antingen eller'-scenario på svenska. Returnera exakt två alternativ utan förklaring. Format:\nAlternativ 1: ...\nAlternativ 2: ..."
          }
        ],
        temperature: 1.3,
        max_tokens: 100
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;
    const [raw1, raw2] = text.split(/Alternativ 2:/i);
    const option1 = raw1.replace(/Alternativ 1:/i, "").trim();
    const option2 = raw2.trim();

    return {
      option1,
      option2,
      votes: { option1: 0, option2: 0 }
    };
  } catch (error) {
    console.error("GPT request failed:", error);
    return {
      option1: "Fel vid hämtning",
      option2: "Försök igen senare",
      votes: { option1: 0, option2: 0 }
    };
  }
}