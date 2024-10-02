// api/upload.js (nova rota no Vercel)
const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
require('dotenv').config();

const app = express();

// Configuração do multer para fazer upload de arquivos
const storage = multer.memoryStorage();  // Use memoryStorage para o Vercel
const upload = multer({ storage });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

app.use(express.json());

app.post('/api/upload', upload.single('image'), async (req, res) => {
  const mimeType = req.file.mimetype;
  const fileBuffer = req.file.buffer; // Usando buffer para serverless

  try {
    const uploadedFile = await fileManager.uploadFile(fileBuffer, { mimeType, displayName: req.file.originalname });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chatSession = model.startChat({
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri,
              },
            },
            { text: "Por favor, analise a imagem enviada e identifique as bolinhas preenchidas no formulário." },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessage("Interprete a imagem de acordo com as bolinhas preenchidas.");
    res.json({ message: result.response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar a imagem' });
  }
});

module.exports = app;
