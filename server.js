require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000; 

app.use(express.json());

app.post('/rate', async (req, res) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        prompt,
        "temperature": 0.7,
        "max_tokens": 250,
        "top_p": 0.9,
        "stop": ["\n"]
      },
      {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

   
    const rating = response.data.generated_text; 

    res.json({ message: rating }); 
  } catch (error) {
    console.error("Error rating prompt:", error);
    res.status(500).json({ error: 'Error rating prompt' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});