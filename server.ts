import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleSceneDescriber,
  handleSignReader,
  handleTextSimplifier,
  handleNavigation,
  handleVoiceAssistant,
  handleChat,
} from './src/server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for camera images (data URIs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware to normalize paths if Vercel serverless passes query parameters or path rewriting
app.use((req, res, next) => {
  // CORS headers for flexibility
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helper to register routes on both with and without /api prefix
function registerPost(endpoint: string, handler: express.RequestHandler) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const withApi = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const withoutApi = cleanEndpoint.startsWith('/api') ? cleanEndpoint.replace(/^\/api/, '') : cleanEndpoint;

  app.post(withApi, handler);
  if (withApi !== withoutApi) {
    app.post(withoutApi, handler);
  }
}

function registerGet(endpoint: string, handler: express.RequestHandler) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const withApi = cleanEndpoint.startsWith('/api') ? cleanEndpoint : `/api${cleanEndpoint}`;
  const withoutApi = cleanEndpoint.startsWith('/api') ? cleanEndpoint.replace(/^\/api/, '') : cleanEndpoint;

  app.get(withApi, handler);
  if (withApi !== withoutApi) {
    app.get(withoutApi, handler);
  }
}

// 1. Scene Describer
registerPost('/gemini/scene-describer', async (req, res) => {
  try {
    const { image, detailLevel = 'standard', language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }
    const data = await handleSceneDescriber(image, detailLevel, language);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Scene describer error:', error);
    res.status(500).json({ error: error?.message || 'Failed to analyze scene.' });
  }
});

// 2. Sign Reader
registerPost('/gemini/sign-reader', async (req, res) => {
  try {
    const { image, question, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }
    const data = await handleSignReader(image, question, language);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Sign reader error:', error);
    res.status(500).json({ error: error?.message || 'Failed to read label.' });
  }
});

// 3. Text Simplifier
registerPost('/gemini/text-simplifier', async (req, res) => {
  try {
    const { text, image, readingLevel = 'simple', language = 'en' } = req.body;
    if (!text && !image) {
      return res.status(400).json({ error: 'Text or image is required' });
    }
    const data = await handleTextSimplifier(text, image, readingLevel, language);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Text simplifier error:', error);
    res.status(500).json({ error: error?.message || 'Failed to simplify text.' });
  }
});

// 4. Navigation Helper
registerPost('/gemini/navigate', async (req, res) => {
  try {
    const {
      destination,
      currentLocation = 'Inside building / current spot',
      accessibilityNeeds = [],
      language = 'en',
    } = req.body;

    if (!destination) {
      return res.status(400).json({ error: 'Destination is required' });
    }

    const data = await handleNavigation(destination, currentLocation, accessibilityNeeds, language);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Navigation error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate route.' });
  }
});

// 5. Voice Assistant
registerPost('/gemini/voice-assistant', async (req, res) => {
  try {
    const { transcript, currentScreen = 'home', language = 'en' } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    const data = await handleVoiceAssistant(transcript, currentScreen, language);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Voice assistant error:', error);
    res.status(500).json({ error: error?.message || 'Voice assistant error.' });
  }
});

// 6. Chat Assistant
registerPost('/gemini/chat', async (req, res) => {
  try {
    const { messages, language = 'en' } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    const message = await handleChat(messages, language);
    res.json({ success: true, message });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error?.message || 'Chat service error.' });
  }
});

// Health check endpoint
registerGet('/health', (req, res) => {
  res.json({ status: 'ok', server: 'AccessNav Server', time: new Date().toISOString() });
});

// Export app for Vercel Serverless Function deployment
export default app;
export { app };

// Dev server / Standalone server initialization
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Dynamic import vite for dev server middleware in AI Studio / local dev
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, () => {
    console.log(`AccessNav server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone listener if NOT running inside Vercel serverless functions
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
