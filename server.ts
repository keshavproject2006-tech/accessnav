import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload limit for camera images (data URIs)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(apiKey ? { apiKey } : {});
const GEMINI_MODEL = 'gemini-3.8-flash';

// Helper function to extract base64 data and mimeType from data URL
function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  // Default to image/jpeg if raw base64
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Resilient GenAI call with automatic exponential backoff for transient 503/429 spikes
async function generateContentWithRetry(params: any, maxRetries = 2): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const msg = typeof err?.message === 'string' ? err.message : JSON.stringify(err);
      const isTransient =
        err?.status === 'UNAVAILABLE' ||
        msg.includes('503') ||
        msg.includes('429') ||
        msg.includes('high demand') ||
        msg.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt <= maxRetries) {
        console.warn(`Gemini call transient error, retrying attempt ${attempt}...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// 1. Scene Describer endpoint
app.post('/api/gemini/scene-describer', async (req, res) => {
  try {
    const { image, detailLevel = 'standard', language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const { mimeType, data } = parseDataUrl(image);

    const systemPrompt = `You are AccessNav, an advanced AI accessibility navigator helping individuals with visual and mobility impairments.
Analyze the provided image and generate an accurate, calm, highly descriptive scene breakdown in ${language}.
Always prioritize safety, orientation, and ease of navigation.

Return a valid JSON object matching this structure:
{
  "summary": "1-2 sentence direct summary of what is immediately ahead",
  "immediateHazards": ["list of immediate physical hazards, trip hazards, drop-offs, stairs, obstacles, or 'None detected'"],
  "pathwayDescription": "Clear description of walkable path or wheelchair route (e.g., smooth tile floor, ramp to the left, 3 steps down)",
  "peopleAndActivity": "Who is present, their general positions, movement, or if area is empty",
  "signsAndLabels": ["List of visible signage, room numbers, exit signs, directional indicators, or elevator icons"],
  "keyObjects": ["Important landmarks or objects (doors, counters, chairs, vending machines)"],
  "fullDetailedDescription": "Detailed sensory description for users who requested 'More Detail'",
  "spokenAnnouncement": "Concise 20-30 word audio-friendly announcement suitable for text-to-speech reading immediately"
}`;

    const promptText = detailLevel === 'detailed'
      ? 'Please provide an exhaustive, high-detail scene description for a visually impaired user navigating this space.'
      : 'Please provide a clear, concise accessibility scene description focused on immediate navigation and hazards.';

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: promptText },
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        summary: text,
        immediateHazards: [],
        pathwayDescription: 'Please proceed with caution.',
        peopleAndActivity: 'Not identified.',
        signsAndLabels: [],
        keyObjects: [],
        fullDetailedDescription: text,
        spokenAnnouncement: text.slice(0, 160),
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Scene describer error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to analyze scene. Please ensure your camera view is clear and try again.',
    });
  }
});

// 2. Sign and Label Reader endpoint
app.post('/api/gemini/sign-reader', async (req, res) => {
  try {
    const { image, question, language = 'en' } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const { mimeType, data } = parseDataUrl(image);

    const systemPrompt = `You are AccessNav Sign & Label Reader, designed for people who have low vision, blindness, or reading disabilities.
Analyze this image of a sign, medicine box/bottle, grocery item, document, warning label, or room plaque.
Language to output in: ${language}.

Return a valid JSON object matching this structure:
{
  "title": "Primary identified item or sign title",
  "category": "Sign | Medicine | Food & Nutrition | Warning | Document | Other",
  "primaryText": "Exact transcription of main heading or crucial text",
  "importantWarnings": ["All warnings, contraindications, expiry dates, allergen alerts, dosage cautions, or danger indicators"],
  "plainExplanation": "Simple, clear explanation in everyday language of what this means and how to use it",
  "details": ["Key instructions, ingredients, hours, or directional notes"],
  "audioReadout": "High-priority text suitable to read aloud via TTS directly into the user's headphones"
}`;

    const promptText = question
      ? `Specific question from user: "${question}". Read and explain this sign/label.`
      : 'Read all visible text on this sign, product label, or menu and explain it clearly.';

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: promptText },
            {
              inlineData: {
                mimeType,
                data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        title: 'Sign or Label',
        category: 'Sign',
        primaryText: text,
        importantWarnings: [],
        plainExplanation: text,
        details: [],
        audioReadout: text.slice(0, 160),
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Sign reader error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to read label. Please try holding the camera closer or with more light.',
    });
  }
});

// 3. Text Simplifier & Reader endpoint
app.post('/api/gemini/text-simplifier', async (req, res) => {
  try {
    const { text, image, readingLevel = 'simple', language = 'en' } = req.body;
    if (!text && !image) {
      return res.status(400).json({ error: 'Text or image is required' });
    }

    const parts: any[] = [];
    let systemPrompt = `You are AccessNav Text Simplifier, aiding individuals with cognitive disabilities, dyslexia, ADHD, or visual fatigue.
Target Reading Level: ${readingLevel} (Simple = Grade 4 plain language, Medium = High school conversational, Detailed = Comprehensive structured breakdown).
Target Language: ${language}.

Format your output strictly as a JSON object:
{
  "title": "Short title or topic",
  "simplifiedText": "The text rewritten in the selected reading level with clear, calm phrasing and short sentences",
  "bulletSummary": ["Key takeaway point 1", "Key takeaway point 2", "Key takeaway point 3"],
  "jargonExplained": [{"word": "difficult word", "meaning": "plain explanation"}],
  "estimatedReadingTimeMinutes": 1,
  "actionItems": ["Actionable steps user should know or do, if any"]
}`;

    parts.push({ text: systemPrompt });

    if (text) {
      parts.push({ text: `Source text to simplify:\n\n${text}` });
    }

    if (image) {
      const { mimeType, data } = parseDataUrl(image);
      parts.push({
        inlineData: {
          mimeType,
          data,
        },
      });
      parts.push({ text: 'Please extract text from this document/image and simplify it according to the requested reading level.' });
    }

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        title: 'Simplified Text',
        simplifiedText: responseText,
        bulletSummary: [responseText],
        jargonExplained: [],
        estimatedReadingTimeMinutes: 1,
        actionItems: [],
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Text simplifier error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to simplify text. Please try again.',
    });
  }
});

// 4. Navigation Helper endpoint
app.post('/api/gemini/navigate', async (req, res) => {
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

    const systemPrompt = `You are AccessNav Navigation Assistant, an expert in physical accessibility, universal design, and orientation/mobility for people with disabilities (wheelchair users, white-cane users, low vision, sensory sensitivities).
Destination: "${destination}"
Current Starting Point / Situation: "${currentLocation}"
User's Accessibility Needs: ${accessibilityNeeds.join(', ') || 'Step-free route, clear tactile cues, safe navigation'}
Language: ${language}

Provide safe, actionable, step-by-step navigation instructions. Always include a clear on-site verification warning.

Return strict JSON:
{
  "routeTitle": "Short title for this route",
  "routeType": "Step-free | Low-sensory / Quiet | Tactile & Auditory-friendly | Standard Accessible",
  "safetyDisclaimer": "AI route guidance is advisory. Always verify paths, physical ramps, and emergency exits on site with staff or physical signage.",
  "keyCheckpoints": ["Checkpoint 1 (e.g. look for blue information sign)", "Checkpoint 2 (elevator bank B)"],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Clear primary instruction",
      "accessibilityTip": "Wheelchair / Cane / Sensory tip for this step",
      "warning": "Any hazard to watch for (e.g. slight threshold lip, automatic opening door)"
    }
  ],
  "whatToAskStaff": "Exact polite question the user can say or show to building staff if lost or stuck",
  "accessibleAmenitiesNearby": ["Accessible restrooms", "Elevators", "Service animal relief area", "Help desk"]
}`;

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }, { text: `Provide step-by-step accessibility directions to reach: ${destination}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = {
        routeTitle: destination,
        routeType: 'Accessible Route',
        safetyDisclaimer: 'Always verify route accessibility on site.',
        keyCheckpoints: [],
        steps: [{ stepNumber: 1, instruction: responseText, accessibilityTip: '', warning: '' }],
        whatToAskStaff: 'Could you please point me towards the accessible elevator or route?',
        accessibleAmenitiesNearby: [],
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Navigation helper error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate navigation route.',
    });
  }
});

// 5. Voice Assistant / Natural Language Intent endpoint
app.post('/api/gemini/voice-assistant', async (req, res) => {
  try {
    const { transcript, currentScreen = 'home', language = 'en' } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const systemPrompt = `You are AccessNav Voice Core, the voice control and AI brain for an accessibility web application.
The user spoke: "${transcript}"
Current app screen: ${currentScreen}
Language: ${language}

Determine if this is a navigation command to jump to a feature in the app, or a direct accessibility query.
App features and their route IDs:
- "scene": Scene Describer (camera view to describe surroundings)
- "text_reader": Text Simplifier & Reader
- "signs": Sign & Label Reader
- "navigate": Accessible Navigation Helper
- "captions": Live Speech Captions
- "emergency": Emergency SOS Panel
- "chat": Accessibility Chat Assistant
- "settings": Accessibility Settings
- "home": Dashboard Home

Return strict JSON:
{
  "targetFeature": "scene | text_reader | signs | navigate | captions | emergency | chat | settings | home | null",
  "spokenResponse": "Short, friendly, clear verbal answer to read back via TTS (max 30 words)",
  "textResponse": "Detailed answer if the user asked a factual or advice question",
  "actionTriggered": "NAVIGATE_FEATURE | ANSWER_QUESTION | EMERGENCY_ALERT | TOGGLE_HIGH_CONTRAST | NONE"
}`;

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        targetFeature: null,
        spokenResponse: 'I heard you. How can I assist you with navigation or reading?',
        textResponse: text,
        actionTriggered: 'ANSWER_QUESTION',
      };
    }

    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Voice assistant error:', error);
    res.status(500).json({
      error: error?.message || 'Voice processing error.',
    });
  }
});

// 6. Chat Assistant endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, userPreferences, language = 'en' } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemInstruction = `You are AccessNav Companion, an empathetic, highly knowledgeable accessibility and disability advocate assistant.
You assist users with:
- Navigating public spaces, transit, schools, and workplaces with physical, sensory, or neurodivergent needs.
- Understanding disability rights (ADA, Section 508, European Accessibility Act, Rights of Persons with Disabilities).
- Assisting with assistive tech (screen readers, braille displays, switches, AAC apps, hearing aids, captioning).
- Plain language conversion and cognitive accessibility.
- Calming encouragement during stressful sensory overload or navigation difficulties.
- Language: Answer in ${language}.
Always keep responses easy to read, broken into clear short paragraphs or bullet points. Avoid walls of unbroken text.`;

    // Map messages
    const contents = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    // Prepend system prompt
    contents.unshift({
      role: 'user',
      parts: [{ text: systemInstruction }],
    });
    contents.splice(1, 0, {
      role: 'model',
      parts: [{ text: 'Understood. I am here to support you with clear, accessible, and respectful navigation and assistance.' }],
    });

    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents,
    });

    res.json({
      success: true,
      message: response.text || 'I am here to help you navigate comfortably.',
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    const rawError = typeof error?.message === 'string' ? error.message : JSON.stringify(error || '');
    const isOverloaded = rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE');
    const friendlyMsg = isOverloaded
      ? 'The accessibility companion is temporarily busy due to high demand. Please try again in a few moments.'
      : 'Chat service encountered an issue. Please try again.';
    res.status(500).json({
      error: friendlyMsg,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite in middleware mode for dev, or serve static dist in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Dynamic import vite for dev server middleware
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

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
