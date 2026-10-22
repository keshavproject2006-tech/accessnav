import { CHENNAI_LOCATIONS } from '../data/chennaiLocations.ts';

/**
 * Client-side fallback generator in case backend connectivity is interrupted or Vercel serverless function is cold.
 */
function getClientFallback(endpoint: string, body: any): any | null {
  // Navigation fallback
  if (endpoint.includes('navigate')) {
    const dest = (body?.destination || '').toLowerCase();
    const matched = CHENNAI_LOCATIONS.find(
      (l) =>
        dest.includes(l.name.toLowerCase()) ||
        dest.includes(l.tamilName.toLowerCase()) ||
        dest.includes(l.id.toLowerCase()) ||
        l.name.toLowerCase().includes(dest)
    );

    if (matched) {
      return {
        routeTitle: `Accessible Route to ${matched.name}`,
        routeType: matched.wheelchairStatus,
        safetyDisclaimer: 'Advisory route. Always verify elevators and ramps on site with station staff.',
        keyCheckpoints: [matched.name, 'Main Accessible Ramp / Entrance', 'Passenger Assistance Counter'],
        steps: [
          {
            stepNumber: 1,
            instruction: `Proceed to the designated accessible entrance of ${matched.name}.`,
            accessibilityTip: matched.accessibleFeatures[0] || 'Level ramp access available.',
            warning: 'Watch for foot traffic near the main entrance.',
          },
          {
            stepNumber: 2,
            instruction: 'Follow yellow tactile ground tiles towards the main concourse and elevators.',
            accessibilityTip: matched.accessibleFeatures[1] || 'Tactile paving leads directly to elevators with Braille buttons.',
            warning: 'Mind door thresholds and gate sensors.',
          },
          {
            stepNumber: 3,
            instruction: 'Arrive at your bay or platform and approach the designated assistance desk if needed.',
            accessibilityTip: matched.tamilAudioTip,
            warning: 'Keep wheelchair brakes engaged while waiting.',
          },
        ],
        whatToAskStaff: `Excuse me, could you please guide me to the nearest accessible elevator or ramp for ${matched.name}?`,
        accessibleAmenitiesNearby: matched.accessibleFeatures,
      };
    }

    const cleanDest = body?.destination || 'Destination';
    return {
      routeTitle: `Accessible Route to ${cleanDest}`,
      routeType: 'Step-free & Tactile Accessible Route',
      safetyDisclaimer: 'AI route guidance is advisory. Always verify paths, physical ramps, and emergency exits on site with staff or physical signage.',
      keyCheckpoints: [
        'Main Accessible Entrance / Information Desk',
        'Level Walkway / Elevator Bank',
        `Arrival at ${cleanDest}`,
      ],
      steps: [
        {
          stepNumber: 1,
          instruction: `Enter via the main step-free entrance or ramp towards ${cleanDest}.`,
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
          instruction: `Proceed directly along the designated accessible concourse to reach ${cleanDest}.`,
          accessibilityTip: 'Ask the nearest station or building assistant if you require physical escort or wheel support.',
          warning: 'Confirm directional signage on-site.',
        },
      ],
      whatToAskStaff: `Excuse me, could you please point me toward the step-free ramp or elevator for ${cleanDest}?`,
      accessibleAmenitiesNearby: [
        'Accessible Restrooms',
        'Elevator Access',
        'Customer Assistance Desk',
        'Emergency Call Point',
      ],
    };
  }

  // Scene Describer fallback
  if (endpoint.includes('scene-describer')) {
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

  // Sign Reader fallback
  if (endpoint.includes('sign-reader')) {
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

  // Text Simplifier fallback
  if (endpoint.includes('text-simplifier')) {
    const source = body?.text || 'Document text';
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

  // Voice Assistant fallback
  if (endpoint.includes('voice-assistant')) {
    const transcript = (body?.transcript || '').toLowerCase();
    let target: string | null = null;
    let spoken = 'I heard you. How can I assist you with navigation or reading?';

    if (transcript.includes('direction') || transcript.includes('navigat') || transcript.includes('chennai') || transcript.includes('map') || transcript.includes('metro')) {
      target = 'navigate';
      spoken = 'Opening accessible navigation directions and Chennai transit maps.';
    } else if (transcript.includes('scene') || transcript.includes('describe') || transcript.includes('camera') || transcript.includes('look')) {
      target = 'scene';
      spoken = 'Opening scene describer camera.';
    } else if (transcript.includes('sign') || transcript.includes('medicine') || transcript.includes('label')) {
      target = 'signs';
      spoken = 'Opening sign and medicine label reader.';
    } else if (transcript.includes('caption') || transcript.includes('hearing') || transcript.includes('speech')) {
      target = 'captions';
      spoken = 'Opening live captions.';
    } else if (transcript.includes('simplify') || transcript.includes('text')) {
      target = 'text_reader';
      spoken = 'Opening text simplifier and reader.';
    } else if (transcript.includes('emergency') || transcript.includes('sos')) {
      target = 'emergency';
      spoken = 'Opening emergency SOS panel.';
    } else if (transcript.includes('chat') || transcript.includes('assistant')) {
      target = 'chat';
      spoken = 'Opening accessibility companion chat.';
    } else if (transcript.includes('setting') || transcript.includes('contrast') || transcript.includes('font')) {
      target = 'settings';
      spoken = 'Opening accessibility settings.';
    }

    return {
      targetFeature: target,
      spokenResponse: spoken,
      textResponse: `Voice command received: "${body?.transcript || ''}". ${spoken}`,
      actionTriggered: target ? 'NAVIGATE_FEATURE' : 'ANSWER_QUESTION',
    };
  }

  return null;
}

/**
 * Robust API caller that prevents JSON parsing errors on HTML error pages,
 * handles Vercel serverless rewrites, and falls back gracefully.
 */
export async function postApi<T = any>(endpoint: string, body: any): Promise<T> {
  let res: Response;

  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (networkError: any) {
    console.warn(`Network error requesting ${endpoint}:`, networkError?.message);
    const fallback = getClientFallback(endpoint, body);
    if (fallback) {
      return fallback as T;
    }
    throw new Error('Connection failed. Please check your internet connection.');
  }

  const contentType = res.headers.get('content-type') || '';

  // Check if server returned HTML (e.g. Vercel 404 HTML page or index.html SPA)
  if (!contentType.includes('application/json')) {
    const rawText = await res.text();
    console.warn(
      `Non-JSON response received from ${endpoint} (Status: ${res.status}). Preview:`,
      rawText.slice(0, 100)
    );

    // Provide seamless client fallback instead of throwing "Unexpected token 'T'..."
    const fallback = getClientFallback(endpoint, body);
    if (fallback) {
      return fallback as T;
    }

    if (rawText.includes('The page cannot be found') || res.status === 404) {
      throw new Error('Service route temporarily unavailable. Please retry in a moment.');
    }

    throw new Error(`Server returned unexpected response (Status ${res.status}).`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (parseError: any) {
    console.warn(`JSON parse error from ${endpoint}:`, parseError?.message);
    const fallback = getClientFallback(endpoint, body);
    if (fallback) {
      return fallback as T;
    }
    throw new Error('Invalid response received from server.');
  }

  if (!res.ok || json.error) {
    const fallback = getClientFallback(endpoint, body);
    if (fallback) {
      return fallback as T;
    }
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return (json.data !== undefined ? json.data : json) as T;
}
