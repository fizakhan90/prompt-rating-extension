let GEMINI_API_KEY;

async function initializeApiKey() {
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
    GEMINI_API_KEY = result.geminiApiKey;
    console.log('API Key status:', GEMINI_API_KEY ? 'Present' : 'Missing');
  } catch (error) {
    console.error('Error retrieving API key:', error);
  }
}

initializeApiKey();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.geminiApiKey) {
    GEMINI_API_KEY = changes.geminiApiKey.newValue;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePrompt') {
    console.log('Received prompt for analysis:', request.prompt);

    analyzePromptWithGemini(request.prompt)
      .then((response) => {
        console.log('Analysis success:', response);
        sendResponse(response);
      })
      .catch((error) => {
        console.error('Analysis failed:', error);
        sendResponse({
          error: true,
          message: error.message,
        });
      });
    return true;
  }
});

async function analyzePromptWithGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  if (!prompt?.trim()) {
    throw new Error('Empty prompt received');
  }

  const API_URL =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  const analysisPrompt = `You are a highly capable prompt optimization assistant that leverages the Gemini API for advanced analysis. Your task is to analyze, enhance, and provide constructive feedback for a given prompt. Follow these steps precisely:

1. Evaluate the provided prompt for clarity, specificity, and overall effectiveness.
2. Generate an improved version of the prompt that maintains its original intent while enhancing clarity and detail.
3. Provide 2–3 concise, actionable suggestions for further improvement.
4. Identify 2–3 specific strengths of the prompt.
5. Identify 2–3 specific weaknesses of the prompt.

Here is the prompt to analyze:

"${prompt}"

Return your response strictly as a JSON object in the exact format below (with no additional text, explanations, or markdown):

{
  "rating": <number between 1 and 10>,
  "enhancedPrompt": "<improved version of the prompt>",
  "suggestions": "<2–3 clear, actionable improvement suggestions>",
  "strengths": "<2–3 specific strong points>",
  "weaknesses": "<2–3 specific areas needing improvement>"
}
`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: analysisPrompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text;

    if (!text) {
      throw new Error('Invalid API response format');
    }

    const cleanedText = text
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Raw API response:', text);
      console.error('Cleaned response:', cleanedText);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse API response as JSON');
    }
  } catch (error) {
    console.error('API or parsing error:', error);
    throw error;
  }
}
