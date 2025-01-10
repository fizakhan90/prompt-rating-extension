document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const promptInput = document.getElementById('promptInput');
  const ratePromptBtn = document.getElementById('ratePromptBtn');
  const resultsDiv = document.getElementById('results');
  const loadingDiv = document.getElementById('loading');
  const contentDiv = document.getElementById('content');

  
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
    }
  });

  
  apiKeyInput.addEventListener('change', () => {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.local.set({ geminiApiKey: apiKey });
  });

  ratePromptBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const userPrompt = promptInput.value.trim();

    if (!apiKey) {
      showError('Please enter your Gemini API key');
      return;
    }

    if (!userPrompt) {
      showError('Please enter a prompt to analyze');
      return;
    }

    try {
    
      ratePromptBtn.disabled = true;
      resultsDiv.style.display = 'block';
      loadingDiv.style.display = 'flex';
      contentDiv.style.display = 'none';

      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzePrompt',
        prompt: userPrompt
      });

      if (analysis.error) {
        throw new Error(analysis.message);
      }


      contentDiv.innerHTML = `
        <div class="rating">${analysis.rating}/10</div>
        <div class="section">
          <div class="section-title">Suggestions</div>
          <div>${analysis.suggestions}</div>
        </div>
        <div class="section">
          <div class="section-title">Strengths</div>
          <div>${analysis.strengths}</div>
        </div>
        <div class="section">
          <div class="section-title">Weaknesses</div>
          <div>${analysis.weaknesses}</div>
        </div>
      `;
      
      contentDiv.style.display = 'block';
    } catch (error) {
      showError(error.message || 'Error analyzing prompt');
    } finally {
      ratePromptBtn.disabled = false;
      loadingDiv.style.display = 'none';
    }
  });

  function showError(message) {
    resultsDiv.style.display = 'block';
    contentDiv.innerHTML = `<div class="error">${message}</div>`;
    contentDiv.style.display = 'block';
    loadingDiv.style.display = 'none';
  }
});