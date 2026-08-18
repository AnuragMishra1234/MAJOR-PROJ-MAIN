const fs = require('fs');
const axios = require('axios');

async function extractText(imageInput) {
  try {
    // 1. Read local image file and convert to Base64 data URL
    const imageBuffer = fs.readFileSync(imageInput);
    const base64Image = imageBuffer.toString('base64');

    const mimeType = imageInput.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const apiKey = process.env.GROQ_API_KEY;
    const groqUrl = process.env.GROQ_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.VISION_MODEL || 'qwen/qwen3.6-27b';

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    // 2. Call the Groq multimodal chat completion endpoint
    const response = await axios.post(
      groqUrl,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Accurately transcribe and extract all visible text from this image. Keep the layout formatting structured.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const extractedText = response.data.choices[0].message.content;

    return {
      success: true,
      text: extractedText,
      confidence: 0.99,
      model: model
    };

  } catch (error) {
    console.error('Vision OCR Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

module.exports = { extractText };