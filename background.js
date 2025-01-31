let GEMINI_API_KEY;

chrome.storage.local.get(['geminiApiKey'], function(result) {
  GEMINI_API_KEY = result.geminiApiKey;
  console.log('API Key status:', GEMINI_API_KEY ? 'Present' : 'Missing');
});


chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.geminiApiKey) {
    GEMINI_API_KEY = changes.geminiApiKey.newValue;
  }
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzePrompt') {
    console.log('Received prompt for analysis:', request.prompt);
    
    analyzePromptWithGemini(request.prompt)
      .then(response => {
        console.log('Analysis success:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Analysis failed:', error);
        sendResponse({
          error: true,
          message: error.message
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

  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  
  const analysisPrompt = 
    'You are an advanced AI trained to analyze and enhance prompts. Your task is to:\n' +
    '1. Analyze the given prompt for effectiveness\n' +
    '2. Generate an enhanced version that maintains the original intent while improving clarity\n' +
    '3. Provide specific feedback\n\n' +
    'Here is the prompt to analyze:\n\n' +
    '"' + prompt + '"\n\n' +
    'Provide a response as a JSON object in the exact format below. Be concise and specific:\n\n' +
    '{\n' +
    '  "rating": <number between 1-10>,\n' +
    '  "enhancedPrompt": "<improved version that maintains original intent but adds clarity and specificity>",\n' +
    '  "suggestions": "<2-3 clear, actionable improvements>",\n' +
    '  "strengths": "<2-3 specific strong points>",\n' +
    '  "weaknesses": "<2-3 specific areas needing improvement>"\n' +
    '}\n\n' +
    'Return only the JSON object with no additional text or formatting.';

  const requestBody = {
    contents: [{
      parts: [{
        text: analysisPrompt
      }]
    }]
  };

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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