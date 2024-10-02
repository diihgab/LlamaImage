const express = require('express');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const cors = require('cors'); 
require('dotenv').config();

const app = express();
const port = 3000;

// Ativar o CORS para todas as rotas
app.use(cors());  // Adicione esta linha

// Configuração do multer para fazer upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

app.use(express.static('public'));
app.use(express.json());

/**
 * Faz upload do arquivo para a IA do Gemini e retorna o resultado.
 */
async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, { mimeType, displayName: path });
  const file = uploadResult.file;
  console.log(`Arquivo ${file.displayName} enviado como: ${file.name}`);
  return file;
}

app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    const uploadedFile = await uploadToGemini(filePath, mimeType);

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
            // Instrução mais clara para a IA
            { text: "Por favor, analise a imagem enviada e identifique as bolinhas preenchidas no formulário. As bolinhas indicam as respostas para perguntas sobre atendimento, limpeza, garagem, ar condicionado, TV, hidromassagem, refeições, frequência de visita, faixa etária, e tipo de relacionamento. Retorne essas respostas em formato JSON." },
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



app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
