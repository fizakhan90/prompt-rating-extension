function debounce(func, wait) { 
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

class PromptAnalyzer {
  constructor() {
    this.lastAnalyzedPrompt = '';
    this.isAnalyzing = false;
    this.currentTextarea = null;
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
          <div class="drag-handle">
            <div class="status-indicator">
              <div class="pulse"></div>
              <div class="inner-dot"></div>
            </div>
            <h3>AI Prompt Optimizer</h3>
          </div>
          <div class="header-controls">
            <button class="icon-btn minimize-btn" aria-label="Minimize">
              <svg width="18" height="2" viewBox="0 0 18 2"><path d="M0 0h18v2H0z" fill="currentColor"/></svg>
            </button>
            <button class="icon-btn close-btn" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
        <div class="analyzer-content">
          <div class="metrics-grid">
            <div class="metric-card rating-card">
              <div class="metric-icon">⭐</div>
              <div class="metric-data">
                <span class="metric-value">-</span>
                <span class="metric-label">Quality Score</span>
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-icon">📝</div>
              <div class="metric-data">
                <span class="metric-value word-count">0</span>
                <span class="metric-label">Word Count</span>
              </div>
            </div>
          </div>
          
          <div class="loading-state">
            <div class="bouncing-loader">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <span class="loading-text">Analyzing your prompt...</span>
          </div>
  
          <div class="analysis-results">
            <div class="result-section enhanced-prompt">
              <div class="section-header">
                <div class="section-title">
                  <span class="section-icon">🚀</span>
                  <h4>Optimized Prompt</h4>
                </div>
                <button class="copy-btn" data-tooltip="Copy optimized prompt">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z" fill="currentColor"/></svg>
                </button>
              </div>
              <div class="section-content scrollable-content"></div>
            </div>
  
            <!-- Improved Horizontal Insights Layout -->
            <div class="analysis-insights">
              <div class="insight-card">
                <div class="insight-header">
                  <span class="insight-icon">💡</span>
                  <h4>Suggestions</h4>
                </div>
                <div class="insight-content" data-insight="suggestions"></div>
              </div>
              <div class="insight-card">
                <div class="insight-header">
                  <span class="insight-icon">✅</span>
                  <h4>Strengths</h4>
                </div>
                <div class="insight-content" data-insight="strengths"></div>
              </div>
              <div class="insight-card">
                <div class="insight-header">
                  <span class="insight-icon">⚠️</span>
                  <h4>Improvements</h4>
                </div>
                <div class="insight-content" data-insight="weaknesses"></div>
              </div>
            </div>
          </div>
  
          <div class="action-bar">
            <button class="primary-btn apply-btn">
              <span class="btn-icon">✏️</span>
              Apply Optimized Prompt
            </button>
            <button class="secondary-btn reset-btn">
              <span class="btn-icon">🔄</span>
              Reset Analysis
            </button>
          </div>
        </div>
      </div>
    `;
  
    document.body.appendChild(container);
    document.head.appendChild(styles);
    document.head.appendChild(toastStyles);

    this.container = container;
    this.setupEventListeners();
    this.makeDraggable();
  }

  setupEventListeners() {
    const minimizeBtn = this.container.querySelector('.minimize-btn');
    const closeBtn = this.container.querySelector('.close-btn');
    const copyBtn = this.container.querySelector('.copy-btn');
    const applyBtn = this.container.querySelector('.apply-btn');
    const resetBtn = this.container.querySelector('.reset-btn');

    minimizeBtn.addEventListener('click', () => this.toggleMinimize());
    closeBtn.addEventListener('click', () => this.container.classList.add('hidden'));
    copyBtn.addEventListener('click', () => this.copyEnhancedPrompt());
    applyBtn.addEventListener('click', () => this.applyEnhancedPrompt());
    resetBtn.addEventListener('click', () => this.resetAnalysis());
  }

  makeDraggable() {
    const panel = this.container.querySelector('.analyzer-panel');
    const handle = this.container.querySelector('.drag-handle');
    let isDragging = false;
    let startX, startY, xOffset = 0, yOffset = 0;

    const dragStart = (e) => {
      if (handle.contains(e.target)) {
        isDragging = true;
        startX = e.clientX - xOffset;
        startY = e.clientY - yOffset;
        panel.style.transition = 'none';
      }
    };

    const dragEnd = () => {
      isDragging = false;
      panel.style.transition = 'transform 0.2s ease';
    };

    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      xOffset = e.clientX - startX;
      yOffset = e.clientY - startY;
      panel.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    };

    document.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);
  }

  observeTextarea() {
    const textareaSelectors = [
      '#prompt-textarea',
      '[data-id="root"]',
      'textarea.prompt-textarea',
      'textarea[placeholder*="Send a message"]',
      'textarea[placeholder*="Type your message"]',
      'textarea[role="textbox"]',
      '[contenteditable="true"]'
    ];

    const observer = new MutationObserver(() => {
      textareaSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
          if (!element.dataset.promptAnalyzerAttached) {
            this.attachToTextarea(element);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  attachToTextarea(element) {
    element.dataset.promptAnalyzerAttached = 'true';
    this.currentTextarea = element;
    element.addEventListener('input', debounce((e) => {
      const value = e.target.value || e.target.textContent;
      if (value?.trim()) {
        this.updateWordCount(value);
        if (value !== this.lastAnalyzedPrompt) {
          this.analyzePrompt(value);
        }
      }
    }, 500));
  }

  toggleMinimize() {
    this.container.querySelector('.analyzer-panel').classList.toggle('minimized');
  }

  copyEnhancedPrompt() {
    const enhancedPrompt = this.container.querySelector('.enhanced-prompt .section-content').textContent;
    navigator.clipboard.writeText(enhancedPrompt);
    this.showToast('Copied to clipboard');
  }

  applyEnhancedPrompt() {
    const enhancedPrompt = this.container.querySelector('.enhanced-prompt .section-content').textContent;
    if (this.currentTextarea) {
      if (this.currentTextarea.tagName === 'INPUT' || this.currentTextarea.tagName === 'TEXTAREA') {
        this.currentTextarea.value = enhancedPrompt;
        this.currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (this.currentTextarea.isContentEditable) {
        this.currentTextarea.innerHTML = enhancedPrompt;
        this.currentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
      this.showToast('Enhanced prompt applied');
    } else {
      this.showToast('No active input found');
    }
  }

  resetAnalysis() {
    this.container.querySelector('.enhanced-prompt .section-content').textContent = '';
    const insights = this.container.querySelectorAll('.insight-content');
    insights.forEach(el => el.textContent = '');
    this.container.querySelector('.metric-value').textContent = '-';
    this.container.querySelector('.word-count').textContent = '0';
    this.lastAnalyzedPrompt = '';
    this.showToast('Analysis reset');
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  updateWordCount(text) {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    this.container.querySelector('.word-count').textContent = words.length;
  }

  async analyzePrompt(prompt) {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    this.lastAnalyzedPrompt = prompt;
    
    const panel = this.container.querySelector('.analyzer-panel');
    const loading = this.container.querySelector('.loading-state');
    const results = this.container.querySelector('.analysis-results');
    
    loading.style.display = 'flex';
    results.style.display = 'none';
    panel.classList.add('analyzing');

    try {
      const analysis = await chrome.runtime.sendMessage({
        action: 'analyzePrompt',
        prompt
      });

      if (analysis.error) throw new Error(analysis.error.message);

      this.container.querySelector('.metric-value').textContent = analysis.rating;
      this.container.querySelector('.enhanced-prompt .section-content').textContent = analysis.enhancedPrompt;
      this.container.querySelector('[data-insight="suggestions"]').innerHTML = analysis.suggestions;
      this.container.querySelector('[data-insight="strengths"]').innerHTML = analysis.strengths;
      this.container.querySelector('[data-insight="weaknesses"]').innerHTML = analysis.weaknesses;

      results.style.display = 'block';
    } catch (error) {
      console.error('Analysis error:', error);
      this.container.querySelector('[data-insight="suggestions"]').textContent = 
        'Analysis failed. Please check your API key configuration.';
    } finally {
      this.isAnalyzing = false;
      loading.style.display = 'none';
      panel.classList.remove('analyzing');
    }
  }
}

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const styles = document.createElement('style');
styles.textContent = `
  /* Container */
  #prompt-analyzer {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 420px;
    z-index: 99999;
    font-family: 'Inter', sans-serif;
  }
  /* Panel */
  #prompt-analyzer .analyzer-panel {
    background: #2d2d2d;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    border: 1px solid #444;
    backdrop-filter: blur(10px);
    transform: translateY(0);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
  }
  #prompt-analyzer .analyzer-panel:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7);
  }
  /* Header */
  #prompt-analyzer .analyzer-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%);
    border-radius: 16px 16px 0 0;
    cursor: grab;
  }
  #prompt-analyzer .analyzer-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
  }
  #prompt-analyzer .header-controls {
    display: flex;
    gap: 8px;
  }
  #prompt-analyzer .icon-btn {
    background: rgba(255,255,255,0.2);
    border: none;
    padding: 6px;
    border-radius: 6px;
    color: #ffffff;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  #prompt-analyzer .icon-btn:hover {
    background: rgba(255,255,255,0.3);
  }
  /* Drag handle */
  #prompt-analyzer .drag-handle {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  #prompt-analyzer .status-indicator {
    position: relative;
    width: 16px;
    height: 16px;
  }
  #prompt-analyzer .inner-dot {
    width: 8px;
    height: 8px;
    background: #ffffff;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
  }
  #prompt-analyzer .pulse {
    position: absolute;
    width: 16px;
    height: 16px;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    animation: pulse 1.5s infinite;
    z-index: 1;
  }
  @keyframes pulse {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
  }
  /* Metrics */
  #prompt-analyzer .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    padding: 20px;
  }
  #prompt-analyzer .metric-card {
    background: #3a3a3a;
    padding: 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: transform 0.2s ease;
  }
  #prompt-analyzer .metric-card:hover {
    transform: translateY(-2px);
  }
  #prompt-analyzer .metric-icon {
    font-size: 24px;
    padding: 12px;
    background: rgba(79,70,229,0.2);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #prompt-analyzer .metric-data {
    display: flex;
    flex-direction: column;
  }
  #prompt-analyzer .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
  }
  #prompt-analyzer .metric-label {
    font-size: 13px;
    color: #a1a1aa;
  }
  /* Analysis results */
  #prompt-analyzer .result-section {
    background: #3a3a3a;
    border-radius: 12px;
    margin: 0 20px 20px;
    overflow: hidden;
  }
  #prompt-analyzer .section-header {
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(79,70,229,0.2);
    border-bottom: 1px solid #444;
  }
  #prompt-analyzer .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  #prompt-analyzer .section-icon {
    font-size: 20px;
    color: #ffffff;
  }
  #prompt-analyzer .section-content {
    padding: 16px;
    font-size: 14px;
    line-height: 1.6;
    color: #e5e5e5;
  }
  #prompt-analyzer .scrollable-content {
    max-height: 220px;
    overflow-y: auto;
  }
  /* Improved Analysis Insights */
  .analysis-insights {
    display: flex;
    gap: 16px;
    padding: 20px;
    overflow-x: auto;
  }
  .insight-card {
    flex: 1;
    background: linear-gradient(135deg, #3a3a3a, #2a2a2a);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .insight-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.4);
  }
  .insight-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 8px;
  }
  .insight-header h4 {
    margin: 0;
    font-size: 16px;
    color: #fff;
    font-weight: 600;
  }
  .insight-icon {
    font-size: 20px;
    color: #4f46e5;
    background: rgba(79,70,229,0.2);
    padding: 4px;
    border-radius: 50%;
  }
  .insight-content {
    font-size: 14px;
    color: #e5e5e5;
    max-height: 220px;
    overflow-y: auto;
    line-height: 1.5;
  }
  /* Action Bar */
  #prompt-analyzer .action-bar {
    padding: 16px 20px;
    border-top: 1px solid #444;
    display: flex;
    gap: 8px;
  }
  #prompt-analyzer .primary-btn, 
  #prompt-analyzer .secondary-btn {
    flex: 1;
    background: #4f46e5;
    color: #ffffff;
    border: none;
    padding: 14px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background 0.2s ease;
  }
  #prompt-analyzer .primary-btn:hover,
  #prompt-analyzer .secondary-btn:hover {
    background: #4338ca;
  }
  /* Loading State */
  #prompt-analyzer .loading-state {
    display: none;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 20px;
  }
  #prompt-analyzer .bouncing-loader {
    display: flex;
    gap: 6px;
  }
  #prompt-analyzer .bouncing-loader div {
    width: 10px;
    height: 10px;
    background: #4f46e5;
    border-radius: 50%;
    animation: bouncing 0.6s infinite alternate;
  }
  #prompt-analyzer .bouncing-loader div:nth-child(2) {
    animation-delay: 0.2s;
  }
  #prompt-analyzer .bouncing-loader div:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes bouncing {
    to {
      transform: translateY(-10px);
      opacity: 0.5;
    }
  }
  /* Toast */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100000;
    animation: toast 0.3s ease-out forwards;
  }
  @keyframes toast {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  /* Minimized */
  #prompt-analyzer .analyzer-panel.minimized {
    height: 60px;
    overflow: hidden;
  }
  #prompt-analyzer .analyzer-panel.minimized .analyzer-content {
    display: none;
  }
`;

const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #ffffff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100000;
    animation: toast 0.3s ease-out forwards;
  }
  @keyframes toast {
    from {
      transform: translate(-50%, 100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
`;

const initAnalyzer = () => {
  if (!window.promptAnalyzer) {
    window.promptAnalyzer = new PromptAnalyzer();
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalyzer);
} else {
  initAnalyzer();
}






