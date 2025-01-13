function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

class PromptAnalyzer {
  constructor() {
    this.lastAnalyzedPrompt = '';
    this.isAnalyzing = false;
    this.analysisQueue = [];
    this.currentTextarea = null;
    this.isMinimized = false;
    this.initialize();
  }

  initialize() {
    this.createUI();
    this.observeTextarea();
  }

  createUI() {
    const container = document.createElement('div');
    container.id = 'prompt-analyzer';
    container.innerHTML = `
      <div class="analyzer-panel">
        <div class="analyzer-header">
          <div class="header-left">
            <span class="status-indicator"></span>
            <h3>Prompt Analysis</h3>
          </div>
          <div class="header-controls">
            <button class="minimize-btn" title="Minimize">−</button>
            <button class="close-btn" title="Close">×</button>
          </div>
        </div>
        <div class="analyzer-content">
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Rating</div>
              <div class="metric-value rating">-/10</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Words</div>
              <div class="metric-value word-count">0</div>
            </div>
          </div>
          
          <div class="loading hidden">
            <div class="spinner"></div>
            <span>Analyzing prompt...</span>
          </div>
          
          <div class="analysis-sections">
            <div class="section enhanced-prompt">
              <div class="section-header">
                <span class="section-icon">✍️</span>
                <h4>Enhanced Prompt</h4>
                <button class="copy-btn" title="Copy to clipboard">📋</button>
              </div>
              <div class="section-content"></div>
            </div>

            <div class="section suggestions">
              <div class="section-header">
                <span class="section-icon">💡</span>
                <h4>Suggestions</h4>
              </div>
              <div class="section-content"></div>
            </div>
            
            <div class="section strengths">
              <div class="section-header">
                <span class="section-icon">✨</span>
                <h4>Strengths</h4>
              </div>
              <div class="section-content"></div>
            </div>
            
            <div class="section weaknesses">
              <div class="section-header">
                <span class="section-icon">⚠️</span>
                <h4>Weaknesses</h4>
              </div>
              <div class="section-content"></div>
            </div>
          </div>

          <div class="action-buttons">
            <button class="apply-enhanced">Apply Enhanced Prompt</button>
            <button class="reset-analysis">Reset Analysis</button>
          </div>
        </div>
      </div>
    `;

    const styles = document.createElement('style');
    styles.textContent = `
      #prompt-analyzer {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 320px;
        z-index: 99999;
        font-family: -apple-system, system-ui, sans-serif;
        transition: all 0.3s ease;
      }

      .analyzer-panel {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid #e0e0e0;
        opacity: 0.95;
        transition: all 0.3s ease;
      }

      .analyzer-panel.minimized {
        width: 180px !important;
        transform: translateY(-80%);
      }

      .analyzer-panel.minimized .analyzer-content {
        display: none;
      }

      .analyzer-panel.minimized .analyzer-header {
        border-bottom: none;
        border-radius: 12px;
      }

      .analyzer-header {
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 12px 12px 0 0;
        cursor: move;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .header-controls {
        display: flex;
        gap: 4px;
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
      }

      .analyzer-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .minimize-btn, .close-btn {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .minimize-btn:hover, .close-btn:hover {
        background: #e0e0e0;
        color: #333;
      }

      .analyzer-content {
        padding: 16px;
        max-height: calc(100vh - 100px);
        overflow-y: auto;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      .metric-card {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 8px;
        text-align: center;
      }

      .metric-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
      }

      .metric-value {
        font-size: 18px;
        font-weight: 600;
        color: #2563eb;
      }

      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        gap: 10px;
      }

      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #e0e0e0;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .section {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        transition: all 0.2s ease;
        border: 1px solid transparent;
      }

      .section:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }

      .section-header {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .section-content {
        font-size: 14px;
        line-height: 1.5;
        color: #475569;
      }

      .enhanced-prompt {
        background: #f0f9ff;
        border-left: 4px solid #2563eb;
      }

      .suggestions { background: #fff7ed; }
      .strengths { background: #f0fdf4; }
      .weaknesses { background: #fef2f2; }

      .copy-btn {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .copy-btn:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.05);
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .apply-enhanced {
        background: #2563eb;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
        flex: 1;
      }

      .apply-enhanced:hover {
        background: #1d4ed8;
      }

      .reset-analysis {
        background: #e5e7eb;
        color: #374151;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
      }

      .reset-analysis:hover {
        background: #d1d5db;
      }

      .success-message {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        animation: fadeInOut 2s forwards;
        z-index: 100000;
      }

      .tooltip {
        position: absolute;
        background: #333;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      }

      .tooltip.visible {
        opacity: 1;
      }

      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      .analyzing .status-indicator {
        background: #f59e0b;
        animation: pulse 1s infinite;
      }

      .hidden {
        display: none !important;
      }
    `;

    document.head.appendChild(styles);
    document.body.appendChild(container);
    
    this.makeDraggable(container.querySelector('.analyzer-panel'), container.querySelector('.analyzer-header'));
    this.container = container;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    const panel = this.container.querySelector('.analyzer-panel');
    const minimizeBtn = this.container.querySelector('.minimize-btn');
    const closeBtn = this.container.querySelector('.close-btn');
    const resetBtn = this.container.querySelector('.reset-analysis');

    minimizeBtn.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      panel.classList.toggle('minimized');
      minimizeBtn.textContent = this.isMinimized ? '+' : '−';
      minimizeBtn.title = this.isMinimized ? 'Expand' : 'Minimize';
    });

    closeBtn.addEventListener('click', () => {
      this.container.classList.add('hidden');
    });

    resetBtn.addEventListener('click', () => {
      this.resetAnalysis();
    });

    this.setupEnhancedPromptFeatures();
    this.setupTooltips();
  }

  setupTooltips() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);

    const showTooltip = (element, text) => {
      const rect = element.getBoundingClientRect();
      tooltip.textContent = text;
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
      tooltip.classList.add('visible');
    };

    const hideTooltip = () => {
      tooltip.classList.remove('visible');
    };

    const tooltipElements = this.container.querySelectorAll('[title]');
    tooltipElements.forEach(element => {
      const tooltipText = element.getAttribute('title');
      element.removeAttribute('title');
      
      element.addEventListener('mouseenter', () => showTooltip(element, tooltipText));
      element.addEventListener('mouseleave', hideTooltip);
    });
  }

  setupEnhancedPromptFeatures() {
    const copyBtn = this.container.querySelector('.copy-btn');
    const applyBtn = this.container.querySelector('.apply-enhanced');

    copyBtn.addEventListener('click', () => {
      const enhancedPrompt = this.container.querySelector('.enhanced-prompt .section-content').textContent;
      navigator.clipboard.writeText(enhancedPrompt);
      this.showSuccessMessage('Enhanced prompt copied to clipboard');
    });

    applyBtn.addEventListener('click', () => {
      if (this.currentTextarea) {
        const enhancedPrompt = this.container.querySelector('.enhanced-prompt .section-content').textContent;
        if (this.currentTextarea.value !== undefined) {
          this.currentTextarea.value = enhancedPrompt;
        } else {
          this.currentTextarea.textContent = enhancedPrompt;
        }
        this.currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        this.showSuccessMessage('Enhanced prompt applied');
      }
    });
  }

  makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const dragMouseDown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.addEventListener('mousemove', elementDrag);
      document.addEventListener('mouseup', closeDragElement);
    };

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      
      const rect = element.getBoundingClientRect();
      const newTop = element.offsetTop - pos2;
      const newLeft = element.offsetLeft - pos1;
      
      if (newTop > 0 && newTop < window.innerHeight - rect.height) {
        element.style.top = newTop + "px";
      }
      if (newLeft > 0 && newLeft < window.innerWidth - rect.width) {
        element.style.left = newLeft + "px";
      }
  };

  const closeDragElement = () => {
    document.removeEventListener('mousemove', elementDrag);
    document.removeEventListener('mouseup', closeDragElement);
  };

  handle.addEventListener('mousedown', dragMouseDown);
}

observeTextarea() {
  const textareaSelectors = [
    '#prompt-textarea',
    '[data-id="root"]',
    'textarea.prompt-textarea',
    'textarea[placeholder*="Send a message"]',
    'textarea[placeholder*="Type your message"]',
    'textarea[role="textbox"]',
    '.prosemirror-editor',
    '[contenteditable="true"]'
  ];

  const checkForTextarea = () => {
    for (const selector of textareaSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (!element.dataset.promptAnalyzerAttached) {
          this.attachToTextarea(element);
        }
      });
    }
  };
  
  checkForTextarea();

  const observer = new MutationObserver(debounce(() => {
    checkForTextarea();
  }, 500));

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });

  setInterval(checkForTextarea, 2000);
}

attachToTextarea(element) {
  element.dataset.promptAnalyzerAttached = 'true';
  
  const captureInput = debounce((e) => {
    const value = e.target.value || e.target.textContent;
    if (value?.trim()) {
      this.updateWordCount(value);
      if (value !== this.lastAnalyzedPrompt) {
        this.queueAnalysis(value);
      }
    }
  }, 750);

  const events = ['input', 'change', 'keyup'];
  events.forEach(event => {
    element.addEventListener(event, captureInput);
  });

  element.addEventListener('focus', () => {
    this.currentTextarea = element;
  });

  const initialContent = element.value || element.textContent;
  if (initialContent?.trim()) {
    this.updateWordCount(initialContent);
    this.queueAnalysis(initialContent);
  }
}

updateWordCount(text) {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCountElement = this.container.querySelector('.word-count');
  wordCountElement.textContent = words.length.toString();
}

queueAnalysis(prompt) {
  this.analysisQueue.push(prompt);
  this.processQueue();
}

async processQueue() {
  if (this.isAnalyzing || this.analysisQueue.length === 0) return;

  const prompt = this.analysisQueue.pop();
  this.analysisQueue = []; // Clear queue to prevent stale analyses
  
  await this.analyzePrompt(prompt);
}

async analyzePrompt(prompt) {
  if (this.isAnalyzing) return;

  const loading = this.container.querySelector('.loading');
  const sections = this.container.querySelector('.analysis-sections');
  const panel = this.container.querySelector('.analyzer-panel');

  try {
    this.isAnalyzing = true;
    this.lastAnalyzedPrompt = prompt;
    
    loading.classList.remove('hidden');
    sections.classList.add('hidden');
    panel.classList.add('analyzing');

    const analysis = await chrome.runtime.sendMessage({
      action: 'analyzePrompt',
      prompt
    });

    if (analysis.error) {
      throw new Error(analysis.error.message || 'Analysis failed');
    }

    this.container.querySelector('.rating').textContent = `${analysis.rating}/10`;
    this.container.querySelector('.enhanced-prompt .section-content').textContent = analysis.enhancedPrompt;
    this.container.querySelector('.suggestions .section-content').textContent = analysis.suggestions;
    this.container.querySelector('.strengths .section-content').textContent = analysis.strengths;
    this.container.querySelector('.weaknesses .section-content').textContent = analysis.weaknesses;

    sections.classList.remove('hidden');
  } catch (error) {
    console.error('Analysis error:', error);
    this.container.querySelector('.suggestions .section-content').textContent = 
      'Analysis failed. Please check your API key configuration.';
  } finally {
    this.isAnalyzing = false;
    loading.classList.add('hidden');
    panel.classList.remove('analyzing');
    this.processQueue();
  }
}

resetAnalysis() {
  this.lastAnalyzedPrompt = '';
  this.container.querySelector('.rating').textContent = '-/10';
  this.container.querySelector('.word-count').textContent = '0';
  this.container.querySelector('.enhanced-prompt .section-content').textContent = '';
  this.container.querySelector('.suggestions .section-content').textContent = '';
  this.container.querySelector('.strengths .section-content').textContent = '';
  this.container.querySelector('.weaknesses .section-content').textContent = '';
  this.showSuccessMessage('Analysis reset');
}

showSuccessMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'success-message';
  messageElement.textContent = message;
  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.remove();
  }, 2000);
}

togglePanel() {
  this.container.classList.toggle('hidden');
}

resize(width, height) {
  const panel = this.container.querySelector('.analyzer-panel');
  if (width) panel.style.width = `${width}px`;
  if (height) panel.style.maxHeight = `${height}px`;
}
}

const initAnalyzer = () => {
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PromptAnalyzer());
} else {
  new PromptAnalyzer();
}
};

initAnalyzer();