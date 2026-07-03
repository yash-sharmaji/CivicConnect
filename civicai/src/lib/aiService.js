export function simulateAIVision(fileName) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerName = fileName.toLowerCase();
      
      // Defaults
      let result = {
        title: 'Detected Pothole & Road Damage',
        description: 'AI detected structural compromise on the asphalt surface. A pothole of approximately 1.5 feet diameter is visible. Presents mild hazard for moving vehicles.',
        category: 'Pothole & Road Damage',
        severity: 'medium',
        confidence: 0.88,
        tags: ['Pothole', 'Asphalt Crack', 'Roadway Hazard'],
        resolvedSuggestion: 'Fill with standard quick-set cold-mix asphalt patch, seal borders to prevent water seepage.'
      };

      if (lowerName.includes('light') || lowerName.includes('lamp') || lowerName.includes('street') && (lowerName.includes('dark') || lowerName.includes('night'))) {
        result = {
          title: 'Damaged Streetlight',
          description: 'AI analyzed light emissions and determined structural damage or bulb failure in the public luminaire. Lumens output: 0%. Dark zone created is approx 40 meters.',
          category: 'Broken Streetlight',
          severity: 'medium',
          confidence: 0.94,
          tags: ['Luminaire Failure', 'Electrical Damage', 'Public Safety Darkzone'],
          resolvedSuggestion: 'Replace HPS bulb with energy-efficient LED luminaire assembly. Check photocell sensor calibration.'
        };
      } else if (lowerName.includes('leak') || lowerName.includes('water') || lowerName.includes('pipe') || lowerName.includes('flood')) {
        result = {
          title: 'High-Volume Water Leakage',
          description: 'AI detected pressurized liquid dispersion escaping from underground line. Flow rate estimate: 8-12 gallons/min. Sidewalk erosion risk is high.',
          category: 'Water Leakage',
          severity: 'high',
          confidence: 0.91,
          tags: ['Water Main Leak', 'Sidewalk Flooding', 'Infrastructure Decay'],
          resolvedSuggestion: 'Isolate main valve, excavate section near joint, clean and replace damaged sleeve gasket.'
        };
      } else if (lowerName.includes('trash') || lowerName.includes('garbage') || lowerName.includes('bin') || lowerName.includes('dump') || lowerName.includes('waste')) {
        result = {
          title: 'Overflowing Refuse Bin',
          description: 'AI detected loose waste scattered outside containment units. Pile volume exceeds bin limits by 180%. Risk of vermin infestation and wind-scattered plastic.',
          category: 'Overflowing Garbage Bins',
          severity: 'medium',
          confidence: 0.97,
          tags: ['Solid Waste Overflow', 'Environmental Hazard', 'Sanitation Deficit'],
          resolvedSuggestion: 'Schedule priority waste collection crew, sweep perimeter, install high-capacity smart bin with fill-level sensors.'
        };
      } else if (lowerName.includes('bridge') || lowerName.includes('wood') || lowerName.includes('plank') || lowerName.includes('structure')) {
        result = {
          title: 'Structural Public Infrastructure Damage',
          description: 'AI identified structural fractures on pedestrian walkways. High probability of load-bearing plank failure. Pedestrian fall risk is imminent.',
          category: 'Damaged Public Infrastructure',
          severity: 'critical',
          confidence: 0.95,
          tags: ['Structural Crack', 'Pedestrian Walkway Hazard', 'Public Woodwork Decay'],
          resolvedSuggestion: 'Restrict bridge access with warning tape immediately. Dispatch carpentry crew to replace structural planks and secure joist anchors.'
        };
      }

      resolve(result);
    }, 2000); // 2 second mock delay for scanning
  });
}
