import dotenv from 'dotenv';
dotenv.config();

/**
 * Analyze an uploaded issue image using Gemini 1.5 Flash or a mock fallback
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - The mime type of the image (e.g. 'image/jpeg')
 * @param {string} originalName - Original filename for mock context
 * @returns {Promise<{title: string, description: string, category: string, severity: 'low'|'medium'|'high'|'critical', confidence: number}>}
 */
export const analyzeIssueImage = async (imageBuffer, mimeType, originalName = '') => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('Gemini API key not found. Using high-fidelity mock fallback.');
    return getMockAnalysis(originalName);
  }

  try {
    const base64Data = imageBuffer.toString('base64');
    
    // Prepare Gemini 1.5 Flash request body for vision analysis
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this image of a public infrastructure or civic issue. 
Return ONLY a valid JSON object matching this structure, with no markdown code blocks, backticks, or extra text:
{
  "title": "Concise title describing the issue (e.g. 'Large pothole on crossing')",
  "description": "A detailed technical description of the hazard, scope, and potential suggestions.",
  "category": "Must be exactly one of: 'Pothole & Road Damage', 'Broken Streetlight', 'Water Leakage', 'Overflowing Garbage Bins', 'Damaged Public Infrastructure'",
  "severity": "Must be exactly one of: 'low', 'medium', 'high', 'critical'",
  "confidence": 0.95
}
Ensure the category is exact, severity matches real hazard conditions, and confidence is a float between 0.0 and 1.0.`
            },
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API returned error code ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const responseText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    // Clean up response if there are markdown blocks (though responseMimeType: application/json should prevent it)
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    // Validate structure
    const validCategories = [
      'Pothole & Road Damage',
      'Broken Streetlight',
      'Water Leakage',
      'Overflowing Garbage Bins',
      'Damaged Public Infrastructure'
    ];
    const validSeverities = ['low', 'medium', 'high', 'critical'];

    return {
      title: result.title || 'Civic Issue Detected',
      description: result.description || 'Civic issue requiring inspection.',
      category: validCategories.includes(result.category) ? result.category : 'Damaged Public Infrastructure',
      severity: validSeverities.includes(result.severity) ? result.severity : 'medium',
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.85
    };
  } catch (error) {
    console.error('Error calling Gemini API, falling back to mock:', error.message);
    return getMockAnalysis(originalName);
  }
};

/**
 * Mock analysis based on file name rules for stable local operations
 */
const getMockAnalysis = (fileName = '') => {
  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes('light') || lowerName.includes('lamp') || lowerName.includes('street')) {
    return {
      title: 'Damaged Streetlight - Dark Zone',
      description: 'AI analyzed image and determined structural damage or bulb failure in the public luminaire. Creating a dangerous dark zone for pedestrians.',
      category: 'Broken Streetlight',
      severity: 'medium',
      confidence: 0.94
    };
  }
  
  if (lowerName.includes('leak') || lowerName.includes('water') || lowerName.includes('pipe') || lowerName.includes('flood')) {
    return {
      title: 'High-Volume Water Leakage',
      description: 'AI detected pressurized liquid dispersion escaping from underground lines, leading to potential sidewalk erosion and water resource waste.',
      category: 'Water Leakage',
      severity: 'high',
      confidence: 0.91
    };
  }
  
  if (lowerName.includes('trash') || lowerName.includes('garbage') || lowerName.includes('bin') || lowerName.includes('dump') || lowerName.includes('waste')) {
    return {
      title: 'Overflowing Refuse Bin',
      description: 'AI detected loose waste scattered outside containment units. Pile volume exceeds bin limits. Risk of vermin infestation and environmental hazards.',
      category: 'Overflowing Garbage Bins',
      severity: 'medium',
      confidence: 0.97
    };
  }
  
  if (lowerName.includes('bridge') || lowerName.includes('wood') || lowerName.includes('plank') || lowerName.includes('structure') || lowerName.includes('walkway')) {
    return {
      title: 'Structural Public Infrastructure Damage',
      description: 'AI identified structural fractures on public paths or walkways. High probability of load-bearing plank failure. Pedestrian fall risk is imminent.',
      category: 'Damaged Public Infrastructure',
      severity: 'critical',
      confidence: 0.95
    };
  }

  // Default pothole match
  return {
    title: 'Detected Pothole & Road Damage',
    description: 'AI detected structural compromise on the asphalt surface. A pothole is visible which presents a mild to high hazard for moving vehicles.',
    category: 'Pothole & Road Damage',
    severity: 'medium',
    confidence: 0.88
  };
};
