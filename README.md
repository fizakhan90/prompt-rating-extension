# Chrome Extension - PromptPal

## Overview
This Chrome extension analyzes user prompts in live environments and helps optimize them so you can get the perfect output on your first try. It not only points out potential pitfalls but also offers actionable suggestions to refine your wording, structure, and context. Whether you're brainstorming ideas, writing an article, or diving into coding challenges, this tool is designed to elevate your prompt game effortlessly.

## Features
- Simple and easy-to-use UI
- Uses Gemini API to process user prompts
- Works locally with minimal setup

## Installation

### Clone the Repository
```
git clone https://github.com/fizakhan90/prompt-rating-extension.git
cd prompt-rating-extension
```

### Add Your Gemini API Key
1. Create a .env file in the root directory of the project
2. Add your Gemini API key to the .env file:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Load the Extension in Chrome
1. Open Chrome and go to chrome://extensions/
2. Enable Developer mode (toggle in the top-right corner)
3. Click *Load unpacked*
4. Select the cloned repository folder

## Getting a Gemini API Key
1. Go to the official Gemini API website
2. Sign up for an account if you don't have one
3. Navigate to the API Keys section
4. Generate a new API key and copy it
5. Add the key to the .env file as shown above

## Configuring Your Gemini API Key

For first-time setup, follow these steps to store your Gemini API key in Chrome's local storage:

### 1. Open Chrome's Developer Console:
- Click on service_worker after going to the extension and then **Inspect**.
- Navigate to the **Console** tab.

### 2. Store Your API Key:
In the console, enter the following command (replace `YOUR_API_KEY` with your actual Gemini API key):

```javascript
chrome.storage.local.set({ gemini_api_key: 'YOUR_API_KEY' }, function() {
  console.log('Gemini API key saved.');
});

```

### Use the Extension
1. Click on the extension icon in the Chrome toolbar
2. Enter a prompt(in ChatGPT or Claude) and get responses from the Gemini API

## Contributing
If you'd like to contribute:
1. Fork the repository
2. Create a new branch
   bash
   git checkout -b feature-branch
   
3. Commit your changes
   bash
   git commit -m 'Add new feature'
   
4. Push to the branch
   bash
   git push origin feature-branch
   
5. Create a pull request
