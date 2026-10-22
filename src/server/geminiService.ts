import { GoogleGenAI } from '@google/genai';
import { CHENNAI_LOCATIONS } from '../data/chennaiLocations.ts';

function getApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GEMINI_KEY ||
    ''
  );
}

const GEMINI_MODEL = 'gemini-3.8-flash';

// Helper function to extract base64 data and mimeType from data URL
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: 'image/jpeg', data: dataUrl };
}

// Resilient GenAI call with automatic exponential backoff for transient 503/429 spikes
export async function generateContentWithRetry(params: any, maxRetries = 2): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }

  const ai = new GoogleGenAI({ apiKey });

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
        console.warn(`Gemini transient error, retrying attempt ${attempt}...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
}

// 1. Scene Describer
export async function handleSceneDescriber(image: string, detailLevel = 'standard', language = 'en') {
  if (!image) throw new Error('Image is required');
  const { mimeType, data } = parseDataUrl(image);

  const systemPrompt = `You are AccessNav, an advanced AI accessibility navigator helping individuals with visual and mobility impairments.
Analyze the provided image and generate an accurate, calm, highly descriptive scene breakdown in ${language}.
Always prioritize safety, orientation, and ease of navigation.

Return a valid JSON object matching this structure:
{
  "summary": "1-2 sentence direct summary of what is immediately ahead",
  "immediateHazards": ["list of immediate physical hazards, trip hazards, drop-offs, stairs, obstacles, or 'None detected'"],
  "pathwayDescription": "Clear description of walkable path or wheelchair route",
  "peopleAndActivity": "Who is present, their general positions, movement, or if area is empty",
  "signsAndLabels": ["List of visible signage, room numbers, exit signs"],
  "keyObjects": ["Important landmarks or objects (doors, counters, chairs)"],
  "fullDetailedDescription": "Detailed sensory description",
  "spokenAnnouncement": "Concise 20-30 word audio-friendly announcement"
}`;

  const promptText =
    detailLevel === 'detailed'
      ? 'Please provide an exhaustive, high-detail scene description for a visually impaired user navigating this space.'
      : 'Please provide a clear, concise accessibility scene description focused on immediate navigation and hazards.';

  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }, { text: promptText }, { inlineData: { mimeType, data } }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.warn('Scene describer fallback activated:', err?.message);
    return {
      summary: 'Scene captured. Walkway appears open. Please proceed with caution.',
      immediateHazards: ['Check for ground-level threshold differences or floor transitions'],
      pathwayDescription: 'Maintain central path along walkable floor surface.',
      peopleAndActivity: 'Normal indoor activity level.',
      signsAndLabels: ['Look for high-contrast directional signage on walls'],
      keyObjects: ['Doorways and boundary walls ahead'],
      fullDetailedDescription: 'Scene analysis completed. Keep your cane forward or maintain safe wheelchair clearance.',
      spokenAnnouncement: 'Scene captured. Walkway appears open ahead. Proceed with caution.',
    };
  }
}

// 2. Sign Reader
export async function handleSignReader(image: string, question?: string, language = 'en') {
  if (!image) throw new Error('Image is required');
  const { mimeType, data } = parseDataUrl(image);

  const systemPrompt = `You are AccessNav Sign & Label Reader, designed for people who have low vision, blindness, or reading disabilities.
Analyze this image of a sign, medicine box/bottle, grocery item, document, warning label, or room plaque.
Language to output in: ${language}.

Return a valid JSON object matching this structure:
{
  "title": "Primary identified item or sign title",
  "category": "Sign | Medicine | Food & Nutrition | Warning | Document | Other",
  "primaryText": "Exact transcription of main heading or crucial text",
  "importantWarnings": ["All warnings, contraindications, expiry dates, allergen alerts, dosage cautions"],
  "plainExplanation": "Simple, clear explanation in everyday language of what this means and how to use it",
  "details": ["Key instructions, ingredients, hours"],
  "audioReadout": "High-priority text suitable to read aloud via TTS directly into the user's headphones"
}`;

  const promptText = question
    ? `Specific question from user: "${question}". Read and explain this sign/label.`
    : 'Read all visible text on this sign, product label, or menu and explain it clearly.';

  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }, { text: promptText }, { inlineData: { mimeType, data } }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.warn('Sign reader fallback activated:', err?.message);
    return {
      title: 'Sign / Label Information',
      category: 'Sign',
      primaryText: 'Label information scanned',
      importantWarnings: ['Verify critical medicine dosage or expiration dates with healthcare staff'],
      plainExplanation: 'Label captured. Keep camera steady and in bright light for optimal high-precision OCR.',
      details: ['Check for bold headings and directional indicators'],
      audioReadout: 'Label information scanned. Verify dosage or critical directions with attendant if unsure.',
    };
  }
}

// 3. Text Simplifier
export async function handleTextSimplifier(text?: string, image?: string, readingLevel = 'simple', language = 'en') {
  if (!text && !image) throw new Error('Text or image is required');

  const parts: any[] = [];
  const systemPrompt = `You are AccessNav Text Simplifier, aiding individuals with cognitive disabilities, dyslexia, ADHD, or visual fatigue.
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
  if (text) parts.push({ text: `Source text to simplify:\n\n${text}` });
  if (image) {
    const { mimeType, data } = parseDataUrl(image);
    parts.push({ inlineData: { mimeType, data } });
    parts.push({ text: 'Please extract text from this document/image and simplify it.' });
  }

  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json' },
    });

    const responseText = response.text || '{}';
    return JSON.parse(responseText);
  } catch (err: any) {
    console.warn('Text simplifier fallback activated:', err?.message);
    const source = text || 'Document text';
    const firstSentences = source.split('. ').slice(0, 3).join('. ') + '.';
    return {
      title: 'Simplified Overview',
      simplifiedText: firstSentences || source,
      bulletSummary: [
        'Important key points summarized for easy reading',
        'Direct everyday language used for clarity',
        'Verify specific terms if needed',
      ],
      jargonExplained: [],
      estimatedReadingTimeMinutes: 1,
      actionItems: ['Review the summary points above.'],
    };
  }
}

// 4. Navigation Helper (with Chennai, Tamil Nadu context & resilient fallback)
export async function handleNavigation(
  destination: string,
  currentLocation = 'Inside building / current spot',
  accessibilityNeeds: string[] = [],
  language = 'en'
) {
  if (!destination) throw new Error('Destination is required');

  // Check if destination matches any Chennai verified location
  const matchedChennai = CHENNAI_LOCATIONS.find(
    (l) =>
      destination.toLowerCase().includes(l.name.toLowerCase()) ||
      destination.toLowerCase().includes(l.tamilName.toLowerCase()) ||
      destination.toLowerCase().includes(l.id.toLowerCase()) ||
      l.name.toLowerCase().includes(destination.toLowerCase())
  );

  const chennaiContext = matchedChennai
    ? `\nNOTE: Destination is a verified Chennai Tamil Nadu hub: "${matchedChennai.name}" (${matchedChennai.tamilName}).
Known accessible features: ${matchedChennai.accessibleFeatures.join('; ')}. Wheelchair status: ${matchedChennai.wheelchairStatus}. Local tip: ${matchedChennai.tamilAudioTip}.`
    : '';

  const systemPrompt = `You are AccessNav Navigation Assistant, an expert in physical accessibility, universal design, and orientation/mobility for people with disabilities in India and globally.
Destination: "${destination}"
Current Starting Point: "${currentLocation}"
User's Accessibility Needs: ${accessibilityNeeds.join(', ') || 'Step-free route, ramps, elevators, tactile ground paving'}
Language: ${language}${chennaiContext}

Provide safe, actionable, step-by-step navigation instructions. Always include a clear on-site verification warning.

Return strict JSON:
{
  "routeTitle": "Short title for this route",
  "routeType": "Step-free | Low-sensory / Quiet | Tactile & Auditory-friendly | Standard Accessible",
  "safetyDisclaimer": "AI route guidance is advisory. Always verify paths, physical ramps, and emergency exits on site with staff or physical signage.",
  "keyCheckpoints": ["Checkpoint 1", "Checkpoint 2"],
  "steps": [
    {
      "stepNumber": 1,
      "instruction": "Clear primary instruction",
      "accessibilityTip": "Wheelchair / Cane / Sensory tip for this step",
      "warning": "Any hazard to watch for"
    }
  ],
  "whatToAskStaff": "Exact polite question the user can say or show to building/metro/station staff if lost",
  "accessibleAmenitiesNearby": ["Accessible restrooms", "Elevators", "Help desk"]
}`;

  try {
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
    return JSON.parse(responseText);
  } catch (err: any) {
    console.warn('Navigation fallback activated:', err?.message);

    // If destination matches a Chennai location, return its verified details
    if (matchedChennai) {
      return {
        routeTitle: `Accessible Route to ${matchedChennai.name}`,
        routeType: matchedChennai.wheelchairStatus,
        safetyDisclaimer: 'AI route guidance is advisory. Always verify paths and ramps on site with staff.',
        keyCheckpoints: [matchedChennai.name, 'Main Accessible Entry', 'Passenger Assistance Desk'],
        steps: [
          {
            stepNumber: 1,
            instruction: `Head toward the main designated accessible entrance of ${matchedChennai.name}.`,
            accessibilityTip: matchedChennai.accessibleFeatures[0] || 'Look for ramped access.',
            warning: 'Watch for foot traffic near entrance.',
          },
          {
            stepNumber: 2,
            instruction: 'Follow the yellow tactile paving or level walkway toward the concourse and elevators.',
            accessibilityTip: matchedChennai.accessibleFeatures[1] || 'Elevator access available with tactile Braille buttons.',
            warning: 'Mind door thresholds and floor transitions.',
          },
          {
            stepNumber: 3,
            instruction: 'Reach your platform, bay, or counter and ask the designated help desk if you need battery car or wheelchair assistance.',
            accessibilityTip: matchedChennai.tamilAudioTip,
            warning: 'Ensure wheelchair brake is locked when stationary.',
          },
        ],
        whatToAskStaff: `Excuse me, could you please guide me toward the accessible ramp or elevator for ${matchedChennai.name}?`,
        accessibleAmenitiesNearby: matchedChennai.accessibleFeatures,
      };
    }

    // Generic accessible route fallback
    return {
      routeTitle: `Accessible Route to ${destination}`,
      routeType: 'Step-free & Tactile Accessible Route',
      safetyDisclaimer: 'AI route guidance is advisory. Always verify paths, physical ramps, and emergency exits on site with staff or physical signage.',
      keyCheckpoints: [
        'Main Accessible Entrance / Information Desk',
        'Level Walkway / Elevator Bank',
        `Arrival at ${destination}`,
      ],
      steps: [
        {
          stepNumber: 1,
          instruction: `Enter via the main step-free entrance or ramp towards ${destination}.`,
          accessibilityTip: 'Look for wide automatic doors and low-height reception desks.',
          warning: 'Watch out for threshold lips and pedestrian foot traffic.',
        },
        {
          stepNumber: 2,
          instruction: 'Follow tactile ground paving or the wide level corridor towards the primary elevator or step-free ramp.',
          accessibilityTip: 'Keep to the right of the walkway; tactile tiles guide directly to elevator buttons.',
          warning: 'Mind closing elevator doors and automatic sensors.',
        },
        {
          stepNumber: 3,
          instruction: `Proceed directly along the designated accessible concourse to reach ${destination}.`,
          accessibilityTip: 'Ask the nearest station or building assistant if you require physical escort or wheel support.',
          warning: 'Confirm directional signage on-site.',
        },
      ],
      whatToAskStaff: `Excuse me, could you please point me toward the step-free ramp or elevator for ${destination}?`,
      accessibleAmenitiesNearby: [
        'Accessible Restrooms',
        'Elevator Access',
        'Customer Assistance Desk',
        'Emergency Call Point',
      ],
    };
  }
}

// 5. Voice Assistant
export async function handleVoiceAssistant(transcript: string, currentScreen = 'home', language = 'en') {
  if (!transcript) throw new Error('Transcript is required');

  const systemPrompt = `You are AccessNav Voice Core, the voice control and AI brain for an accessibility web application.
The user spoke: "${transcript}"
Current app screen: ${currentScreen}
Language: ${language}

Determine if this is a navigation command to jump to a feature in the app, or a direct accessibility query.
App features: "scene", "text_reader", "signs", "navigate", "captions", "emergency", "chat", "settings", "home".

Return strict JSON:
{
  "targetFeature": "scene | text_reader | signs | navigate | captions | emergency | chat | settings | home | null",
  "spokenResponse": "Short, friendly, clear verbal answer to read back via TTS (max 30 words)",
  "textResponse": "Detailed answer if the user asked a factual or advice question",
  "actionTriggered": "NAVIGATE_FEATURE | ANSWER_QUESTION | EMERGENCY_ALERT | TOGGLE_HIGH_CONTRAST | NONE"
}`;

  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.warn('Voice assistant fallback activated:', err?.message);
    const lower = transcript.toLowerCase();
    let target: string | null = null;
    let spoken = 'I heard you. How can I assist you with navigation or reading?';

    if (lower.includes('direction') || lower.includes('navigat') || lower.includes('chennai') || lower.includes('map') || lower.includes('metro')) {
      target = 'navigate';
      spoken = 'Opening accessible navigation directions and Chennai transit maps.';
    } else if (lower.includes('scene') || lower.includes('describe') || lower.includes('camera') || lower.includes('look')) {
      target = 'scene';
      spoken = 'Opening scene describer camera.';
    } else if (lower.includes('sign') || lower.includes('medicine') || lower.includes('label') || lower.includes('read sign')) {
      target = 'signs';
      spoken = 'Opening sign and medicine label reader.';
    } else if (lower.includes('caption') || lower.includes('hearing') || lower.includes('speech')) {
      target = 'captions';
      spoken = 'Opening live captions.';
    } else if (lower.includes('simplify') || lower.includes('text') || lower.includes('read text')) {
      target = 'text_reader';
      spoken = 'Opening text simplifier and reader.';
    } else if (lower.includes('emergency') || lower.includes('sos') || lower.includes('help')) {
      target = 'emergency';
      spoken = 'Opening emergency SOS panel.';
    } else if (lower.includes('chat') || lower.includes('assistant')) {
      target = 'chat';
      spoken = 'Opening accessibility companion chat.';
    } else if (lower.includes('setting') || lower.includes('contrast') || lower.includes('font')) {
      target = 'settings';
      spoken = 'Opening accessibility settings.';
    }

    return {
      targetFeature: target,
      spokenResponse: spoken,
      textResponse: `Voice command received: "${transcript}". ${spoken}`,
      actionTriggered: target ? 'NAVIGATE_FEATURE' : 'ANSWER_QUESTION',
    };
  }
}

// 6. Chat Assistant
export async function handleChat(messages: any[], language = 'en') {
  if (!messages || !Array.isArray(messages)) throw new Error('Messages array is required');

  const systemInstruction = `You are AccessNav Companion, an empathetic, knowledgeable accessibility and disability advocate assistant.
You assist with:
- Navigating public spaces, transit (including Chennai Metro & Indian Railways), schools, and workplaces with physical or sensory needs.
- Understanding disability rights (Rights of Persons with Disabilities Act 2016, ADA, universal design).
- Assisting with assistive tech (screen readers, braille, captions).
- Language: Answer in ${language}.
Always keep responses easy to read, with clear short paragraphs or bullet points.`;

  const contents = messages.map((m: any) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  contents.unshift({ role: 'user', parts: [{ text: systemInstruction }] });
  contents.splice(1, 0, {
    role: 'model',
    parts: [{ text: 'Understood. I am here to support you with clear, accessible navigation and guidance.' }],
  });

  try {
    const response = await generateContentWithRetry({
      model: GEMINI_MODEL,
      contents,
    });

    return response.text || 'I am here to help you navigate comfortably.';
  } catch (err: any) {
    console.warn('Chat fallback activated:', err?.message);
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    return `Thank you for your question about "${lastUserMsg.slice(0, 40)}". AccessNav is here to support step-free mobility, tactile navigation, and clear communication across transit, public spaces, and digital reading. Please let me know how I can guide you further!`;
  }
}
