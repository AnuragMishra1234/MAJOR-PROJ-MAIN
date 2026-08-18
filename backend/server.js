require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const textGenerator = require('./textGenerator');
const codeGenerator = require('./codeGenerator');
const visionOCR = require('./visionOCR');
const allTasks = require('./allTasks');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const handle = (taskName, fn) => async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await fn(req);
    res.json({
      success: true,
      task: taskName,
      data,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const status = err.status || (err.response?.status) || 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
};

app.post(
  '/api/generate/text',
  handle('text', async (req) => {
    const { goal, context } = req.body || {};
    if (!goal) {
      const error = new Error('Goal is required');
      error.status = 400;
      throw error;
    }
    return await textGenerator.generate(goal, context);
  })
);

app.post(
  '/api/generate/code',
  handle('code', async (req) => {
    const { goal, language, context } = req.body || {};
    if (!goal) {
      const error = new Error('Goal is required');
      error.status = 400;
      throw error;
    }
    return await codeGenerator.generate(goal, language, context);
  })
);

app.post('/api/generate/vision', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  const filePath = req.file?.path;
  const imageUrl = req.body?.imageUrl;
  const input = filePath || imageUrl;

  if (!input) {
    return res.status(400).json({
      success: false,
      error: 'Image file or imageUrl is required',
    });
  }

  try {
    const data = await visionOCR.extractText(input);
    res.json({
      success: true,
      task: 'vision',
      data,
      latencyMs: Date.now() - startTime,
    });
  } catch (err) {
    const status = err.status || 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      error: err.message || 'Vision OCR failed',
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
  }
});

app.post(
  '/api/generate/repair',
  handle('repair', async (req) => {
    const { goal, previousOutput, errorMessage, context } = req.body || {};
    if (!goal || !previousOutput || !errorMessage) {
      const error = new Error('Goal, previousOutput, and errorMessage are required');
      error.status = 400;
      throw error;
    }
    return await textGenerator.repair(goal, previousOutput, errorMessage, context);
  })
);

app.post(
  '/api/task',
  handle('task', async (req) => {
    const { type, params } = req.body || {};
    if (!type) {
      const error = new Error('Task type is required');
      error.status = 400;
      throw error;
    }
    return await allTasks.runTask(type, params || {});
  })
);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    groqConfigured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Generation Engine running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
