import logger from "../../lib/logger.js";

const SYMPTOM_DB = [
  {
    condition: "Common Cold",
    urgency: "low",
    symptoms: ["runny nose", "sore throat", "sneezing", "congestion", "mild fever", "cough"],
    recommendations: ["Rest and fluids", "Over-the-counter cold remedies", "Steam inhalation"],
  },
  {
    condition: "Influenza (Flu)",
    urgency: "medium",
    symptoms: ["high fever", "body aches", "fatigue", "headache", "cough", "chills", "sore throat"],
    recommendations: ["Rest for at least 5–7 days", "Antiviral medication if within 48 h of onset", "Consult a doctor"],
  },
  {
    condition: "COVID-19",
    urgency: "medium",
    symptoms: ["fever", "dry cough", "fatigue", "loss of taste", "loss of smell", "shortness of breath", "body aches"],
    recommendations: ["Isolate immediately", "Get tested", "Monitor oxygen levels", "Seek emergency care if SpO2 < 94%"],
  },
  {
    condition: "Hypertension (High Blood Pressure)",
    urgency: "medium",
    symptoms: ["headache", "dizziness", "blurred vision", "chest pain", "nosebleed"],
    recommendations: ["Check blood pressure immediately", "Reduce salt intake", "Consult a doctor for medication review"],
  },
  {
    condition: "Migraine",
    urgency: "low",
    symptoms: ["severe headache", "throbbing pain", "nausea", "light sensitivity", "sound sensitivity", "vomiting"],
    recommendations: ["Rest in a dark quiet room", "Hydrate", "Take prescribed migraine medication"],
  },
  {
    condition: "Gastroenteritis",
    urgency: "medium",
    symptoms: ["diarrhea", "vomiting", "stomach cramps", "nausea", "fever", "dehydration"],
    recommendations: ["Oral rehydration salts", "Bland diet (BRAT)", "Consult a doctor if symptoms persist > 48 h"],
  },
  {
    condition: "Urinary Tract Infection (UTI)",
    urgency: "medium",
    symptoms: ["burning urination", "frequent urination", "pelvic pain", "cloudy urine", "blood in urine", "urgency"],
    recommendations: ["See a doctor for antibiotics", "Increase water intake", "Avoid caffeine and alcohol"],
  },
  {
    condition: "Anxiety / Panic Attack",
    urgency: "low",
    symptoms: ["chest tightness", "rapid heartbeat", "shortness of breath", "dizziness", "trembling", "sweating", "fear"],
    recommendations: ["Deep breathing exercises", "Grounding techniques", "Consider speaking to a mental health professional"],
  },
  {
    condition: "Cardiac Emergency",
    urgency: "critical",
    symptoms: ["severe chest pain", "left arm pain", "jaw pain", "sweating", "nausea", "shortness of breath", "pressure in chest"],
    recommendations: ["Call emergency services (911) immediately", "Chew aspirin if not allergic", "Do not drive yourself"],
  },
  {
    condition: "Respiratory Infection",
    urgency: "medium",
    symptoms: ["productive cough", "chest pain", "fever", "shortness of breath", "fatigue", "wheezing"],
    recommendations: ["Consult a doctor", "Complete prescribed antibiotic course", "Use inhaler if prescribed"],
  },
];

/**
 * Analyze a list of symptom strings against a local medical knowledge base.
 * Returns top matching conditions ranked by relevance.
 */
export function analyzeSymptoms({ symptoms = [], age, gender } = {}) {
  try {
    if (!symptoms.length) return { matches: [], message: "No symptoms provided" };

    const normalised = symptoms.map((s) => s.toLowerCase().trim());

    const scored = SYMPTOM_DB.map((entry) => {
      const matched = entry.symptoms.filter((s) =>
        normalised.some((n) => n.includes(s) || s.includes(n)),
      );
      return { ...entry, matchCount: matched.length, matchedSymptoms: matched };
    })
      .filter((e) => e.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount || b.urgency.localeCompare(a.urgency));

    const topMatches = scored.slice(0, 3).map(({ condition, urgency, recommendations, matchCount, matchedSymptoms }) => ({
      condition,
      urgency,
      recommendations,
      matchCount,
      matchedSymptoms,
    }));

    const highestUrgency = topMatches.find((m) => m.urgency === "critical")
      ? "critical"
      : topMatches.find((m) => m.urgency === "medium")
        ? "medium"
        : "low";

    return {
      matches: topMatches,
      overallUrgency: highestUrgency,
      disclaimer: "This is a preliminary analysis only. Please consult a licensed healthcare professional for a proper diagnosis.",
    };
  } catch (err) {
    logger.error("[SymptomAnalysis] Analysis failed:", err.message);
    return { matches: [], message: "Analysis failed" };
  }
}

/**
 * Analyse an uploaded prescription image — extracts text description if provided.
 * Drop-in replacement for the removed agentcrop.com API call.
 */
export async function detectPrescriptionDisease(imageUrl, notes = "") {
  logger.log("[SymptomAnalysis] Image analysis requested for:", imageUrl);
  return {
    analysisType: "prescription_image",
    note: "Automated image analysis requires integration with a medical imaging API. A doctor will review this manually.",
    imageUrl,
    additionalNotes: notes,
    reviewRequired: true,
  };
}
