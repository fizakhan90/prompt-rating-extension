function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

class PromptAnalyzer {
  constructor() {
    this.container = null;
    this.currentPrompt = '';
    this.isAnalyzing = false;
  }

  initialize() {
    this.createUI();
    this.setupObserver();
  }

  createUI() {
    this.container = document.createElement('div');
    this.container.id = 'prompt-feedback-container';
    this.container.innerHTML = `
      <div class="prompt-feedback">
        <div class="feedback-header">
          <h3>Prompt Analysis</h3>
          <button class="close-btn">×</button>
        </div>
        <div class="feedback-content">
          <div class="loading hidden">Analyzing...</div>
          <div class="results hidden"></div>
          <div class="error hidden"></div>
        </div>
      </div>
    `;

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
      #prompt-feedback-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .prompt-feedback {
        padding: 15px;
      }

      .feedback-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .feedback-header h3 {
        margin: 0;
        font-size: 16px;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
      }

      .loading, .results, .error {
        padding: 10px;
        border-radius: 4px;
      }

      .loading {
        background: #f5f5f5;
      }

      .error {
        background: #fee;
        color: #d32f2f;
      }

      .hidden {
        display: none;
      }

      .rating {
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0;
      }

      .section {
        margin: 10px 0;
      }

      .section-title {
        font-weight: 600;
        margin-bottom: 5px;
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(this.container);

    // Add event listeners
    this.container.querySelector('.close-btn').addEventListener('click', () => {
      this.container.classList.add('hidden');
    });
  }

  setupObserver() {
    const observer = new MutationObserver(
      debounce(() => this.checkForPromptChanges(), 1000)
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async checkForPromptChanges() {
    const textarea = document.querySelector('textarea');
    if (!textarea?.value || textarea.value === this.currentPrompt || this.isAnalyzing) {
      return;
    }

    this.currentPrompt = textarea.value;
    await this.analyzePrompt(this.currentPrompt);
  }

  async analyzePrompt(prompt) {
    const content = this.container.querySelector('.feedback-content');
    const loading = content.querySelector('.loading');
    const results = content.querySelector('.results');
    const error = content.querySelector('.error');

    try {
      this.isAnalyzing = true;
      loading.classList.remove('hidden');
      results.classList.add('hidden');
      error.classList.add('hidden');

      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzePrompt',
        prompt
      });

      if (analysis.error) {
        throw new Error(analysis.message);
      }

      results.innerHTML = `
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

      results.classList.remove('hidden');
    } catch (err) {
      error.textContent = err.message;
      error.classList.remove('hidden');
    } finally {
      this.isAnalyzing = false;
      loading.classList.add('hidden');
    }
  }
}

// Initialize when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PromptAnalyzer().initialize();
  });
} else {
  new PromptAnalyzer().initialize();
}