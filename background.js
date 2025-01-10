let GEMINI_API_KEY;

chrome.storage.local.get(['geminiApiKey'], function(result) {
  GEMINI_API_KEY = result.geminiApiKey;
  console.log('API Key status:', GEMINI_API_KEY ? 'Present' : 'Missing');
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
    'Analyze this AI prompt and rate it based on:\n' +
    '- Clarity\n' +
    '- Specificity\n' +
    '- Contextual information\n' +
    '- Goal orientation\n\n' +
    'Prompt: "' + prompt + '"\n\n' +
    'Provide response as a valid JSON object with this exact format:\n' +
    '{\n' +
    '  "rating": <1-10>,\n' +
    '  "suggestions": "<specific improvements>",\n' +
    '  "strengths": "<what works well>",\n' +
    '  "weaknesses": "<areas to improve>"\n' +
    '}\n' +
    'Return only the JSON object with no markdown formatting or additional text.';

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