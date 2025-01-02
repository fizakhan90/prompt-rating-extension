const ratePromptBtn = document.getElementById('ratePromptBtn');
const promptInput = document.getElementById('promptInput');
const ratingDisplay = document.getElementById('rating');

ratePromptBtn.addEventListener('click', async () => {
  const userPrompt = promptInput.value;

  if (userPrompt.trim() === '') {
    alert('Please enter a prompt.');
    return;
  }

  const prompt = `**Evaluate the following prompt for clarity, specificity, and potential biases:** \n\n '${userPrompt}'`;

  try {
    const response = await fetch('/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    ratingDisplay.textContent = data.message || 'Prompt rated successfully.'; 

  } catch (error) {
    console.error('Error rating prompt:', error);
    ratingDisplay.textContent = 'Error rating prompt.';
  }
});