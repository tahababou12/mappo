import OpenAI from 'openai';

// Initialize the OpenAI API client
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('OpenAI API key is missing. Please check your .env file.');
}

// Create OpenAI API instance
const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true, // Only for frontend usage
});

// Function to send a message to the OpenAI API
export async function sendMessageToOpenAI(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[]
) {
  try {
    if (!openaiApiKey) {
      return {
        message: "OpenAI API key is missing. Please check your .env file.",
        error: "API key missing",
      };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      message: response.choices[0].message?.content || '',
      error: null,
    };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return {
      message: null,
      error: error instanceof Error ? error.message : 'Error communicating with OpenAI API',
    };
  }
} 