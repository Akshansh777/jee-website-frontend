/**
 * JEE SOCIETY AI — FINAL MODEL SPEC (PRODUCTION - UPDATED FOR 27/28)
 * Implements strict time-weighted scoring logic for JEE 2027 and JEE 2028.
 * Fully supports both single-select numbers and multi-select arrays.
 */

// --- 1. HELPERS & NORMALIZATION ---

function normalize(answerIndex) {
  if (answerIndex === undefined || answerIndex === null || answerIndex === "") return 0;

  const map = [1.0, 0.66, 0.33, 0.0];

  // Case A: Multi-Select Array
  if (Array.isArray(answerIndex)) {
    if (answerIndex.length === 0) return 0;
    // If only 1 option was picked: returns EXACT original weight
    // If multiple options were picked: returns the clean arithmetic mean
    const sum = answerIndex.reduce((acc, curr) => {
      const idx = Number(curr);
      return acc + (!isNaN(idx) && map[idx] !== undefined ? map[idx] : 0);
    }, 0);
    return sum / answerIndex.length;
  }

  // Case B: Standard Single-Select Number or String
  const idx = Number(answerIndex);
  if (isNaN(idx)) return 0;
  return map[idx] !== undefined ? map[idx] : 0;
}

const Q19_MULTIPLIER = [0.3, 0.5, 0.8, 1.0];
function getQ19Multiplier(responses) {
  const val = Array.isArray(responses["q19"]) ? responses["q19"][0] : responses["q19"];
  const idx = Number(val);
  return Q19_MULTIPLIER[idx] !== undefined ? Q19_MULTIPLIER[idx] : 0.5;
}

function getEpsilon(responses) {
  const keys = Object.keys(responses).sort();
  let str = "";
  keys.forEach((k) => {
    const val = responses[k];
    str += Array.isArray(val) ? val.join("") : String(val);
  });
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; 
  }
  
  const seed = (Math.abs(hash) % 1000) / 1000; 
  return 0.12 + (seed * (0.47 - 0.12)); 
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
        a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCDF(x, mean, std) {
  return 0.5 * (1 + erf((x - mean) / (std * Math.SQRT2)));
}

function computePercentileVsAspirants(jss) {
  const ASPIRANT_MEAN = 38;
  const ASPIRANT_STD = 16;
  const raw = normalCDF(jss, ASPIRANT_MEAN, ASPIRANT_STD) * 100;
  return clamp(raw, 3, 97);
}

function diagnoseStatus(categoryKey, ratio) {
  const tiers = {
    consistency_execution: [
      [0.75, "Strong Daily Execution"],
      [0.45, "Unstable Study Hours"],
      [0, "Execution Breaking Down"],
    ],
    syllabus_coverage: [
      [0.75, "Strong Syllabus Control"],
      [0.45, `${Math.round(ratio * 100)}% Covered (Needs Core Focus)`],
      [0, `${Math.round(ratio * 100)}% Covered (Critical Backlog)`],
    ],
    recall_error_control: [
      [0.75, "Sharp Recall Under Pressure"],
      [0.45, "Moderate Formula Decay in Mocks"],
      [0, "High Formula Decay in Mock Tests"],
    ],
    exam_baseline: [
      [0.75, "Strong Recent Mock Performance"],
      [0.45, "Mid-Tier Mock Performance"],
      [0, "Low Solving Density in Mocks"],
    ],
    environment_stability: [
      [0.75, "Stable, Supportive Environment"],
      [0.45, "Some Environmental Friction"],
      [0, "High Environmental Disruption"],
    ],
  };
  const list = tiers[categoryKey] || [[0, "Needs Review"]];
  for (const [threshold, label] of list) {
    if (ratio >= threshold) return label;
  }
  return list[list.length - 1][1];
}

// --- 2. MAIN COMPUTE FUNCTION ---

export function computeScores(responses) {
  const getQ = (qid) => normalize(responses[qid]);

  const EI = 0.30 * getQ("q1") + 0.25 * getQ("q8") + 0.10 * getQ("q2") + 0.15 * getQ("q9") + 0.20 * getQ19Multiplier(responses);
  const avgPCM = (getQ("q4") + getQ("q5") + getQ("q6")) / 3;
  const CI = 0.4 * getQ("q3") + 0.2 * avgPCM;
  const REI = 0.6 * getQ("q7") + 0.4 * getQ("q10");
  const SI = (getQ("q11") + getQ("q13") + getQ("q14") + getQ("q15") + getQ("q16")) / 5;

  const pBaseMap = [98.2, 93.4, 82.6, 63.8];
  const q18Val = Array.isArray(responses["q18"]) ? responses["q18"][0] : responses["q18"];
  const q18Idx = Number(q18Val || 3);
  const P_base = pBaseMap[q18Idx] !== undefined ? pBaseMap[q18Idx] : 63.8;

  let JSS = 100 * (0.30 * EI + 0.25 * CI + 0.20 * REI + 0.15 * (P_base / 100) + 0.10 * SI);
  JSS = clamp(JSS, 0, 100);

  const q17Val = Array.isArray(responses["q17"]) ? responses["q17"][0] : responses["q17"];
  const q17Idx = Number(q17Val || 0);
  const attemptType = q17Idx === 0 ? "2027" : "2028";
  
  const epsilon = getEpsilon(responses);
  
  let P_expected = 0;
  let Expected_Range = [0, 0];
  let P_potential = 0;
  let Potential_Range = [0, 0];

  if (attemptType === "2027") {
    const F_27 = 0.40 * EI + 0.35 * CI + 0.15 * REI + 0.10 * SI;
    const DeltaE_27 = 14 * F_27;
    
    if (P_base < 95) {
      P_expected = Math.min(95.5, P_base + DeltaE_27) + epsilon;
    } else {
      P_expected = Math.min(98.8, P_base + 0.6 * DeltaE_27) + epsilon;
    }
    
    Expected_Range = [P_expected - 2.0, P_expected + 2.0];

    const G_27 = 0.50 * EI + 0.35 * CI + 0.15 * REI;
    const P_raw_27 = 98.2 + 1.4 * G_27 + 0.04 * (P_base - 70);
    P_potential = clamp(P_raw_27 + epsilon, 97.5, 99.6);
    
    Potential_Range = [P_potential - 1.4, P_potential + 1.4];

  } else {
    const F_28 = 0.50 * EI + 0.15 * CI + 0.15 * REI + 0.20 * SI; 
    const DeltaE_28 = 22 * F_28;
    
    P_expected = Math.min(97.8, P_base + DeltaE_28) + epsilon;
    Expected_Range = [P_expected - 2.8, P_expected + 2.8];

    const G_28 = 0.60 * EI + 0.10 * CI + 0.15 * REI + 0.15 * SI;
    const P_raw_28 = 98.5 + 1.4 * G_28 + 0.02 * (P_base - 50);
    P_potential = clamp(P_raw_28 + epsilon, 98.8, 99.9);
    
    Potential_Range = [P_potential - 1.0, P_potential + 1.0];
  }

  const format = (n) => Number(n.toFixed(2));
  
  if (P_expected > P_potential) {
    console.warn("Adjusting P_expected to match P_potential");
    P_expected = P_potential - 0.1;
  }

  // --- MANIFEST KEY MAPPING (Internal Fallback) ---
  function mapAnswersToManifest(resp) {
    const out = {};
    const letters = ["A", "B", "C", "D", "E"];
    Object.keys(resp).forEach((k) => {
      if (k.startsWith("q")) {
        const qNum = k.substring(1);
        const val = resp[k];
        if (Array.isArray(val)) {
          if (val.length === 1) {
            const idx = Number(val[0]);
            out[k] = `Q${qNum}_${letters[idx] || "D"}`;
          } else {
            out[k] = val.map((v) => `Q${qNum}_${letters[Number(v)] || "D"}`);
          }
        } else {
          const idx = Number(val);
          const letter = letters[idx] || "D";
          out[k] = `Q${qNum}_${letter}`;
        }
      }
    });
    return out;
  }

  const manifestKeys = mapAnswersToManifest(responses);

  const breakdownRaw = [
    { key: "consistency_execution", label: "Consistency & Execution", max: 30, earnedRatio: EI },
    { key: "syllabus_coverage", label: "Syllabus Coverage", max: 25, earnedRatio: CI },
    { key: "recall_error_control", label: "Recall & Error Control", max: 20, earnedRatio: REI },
    { key: "exam_baseline", label: "Exam Performance Baseline", max: 15, earnedRatio: P_base / 100 },
    { key: "environment_stability", label: "Environment & Stability", max: 10, earnedRatio: SI },
  ];

  const breakdown = breakdownRaw.map((b) => ({
    key: b.key,
    label: b.label,
    max: b.max,
    earned: format(b.earnedRatio * b.max),
    ratio: clamp(b.earnedRatio, 0, 1),
    status: diagnoseStatus(b.key, clamp(b.earnedRatio, 0, 1)),
  }));

  const percentileVsAspirants = format(computePercentileVsAspirants(JSS));

  return {
    jee_society_score: format(JSS),
    expected_percentile: format(P_expected),
    expected_percentile_range: [
      format(clamp(Expected_Range[0], 0, 99.9)),
      format(clamp(Expected_Range[1], 0, 99.9))
    ],
    potential_percentile: format(P_potential),
    potential_percentile_range: [
      format(clamp(Potential_Range[0], 0, 99.9)),
      format(clamp(Potential_Range[1], 0, 99.9))
    ],
    attempt_type: attemptType,
    manifestKeys,
    breakdown,
    percentile_vs_aspirants: percentileVsAspirants,
  };
}