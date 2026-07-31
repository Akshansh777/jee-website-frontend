/**
 * JEE SOCIETY AI — FINAL MODEL SPEC (PRODUCTION - UPDATED FOR 27/28)
 * Implements strict time-weighted scoring logic for JEE 2027 and JEE 2028.
 */

// --- 1. HELPERS & NORMALIZATION ---

function normalize(answerIndex) {
  const idx = Number(answerIndex);
  if (isNaN(idx)) return 0;
  const map = [1.0, 0.66, 0.33, 0.0];
  return map[idx] !== undefined ? map[idx] : 0;
}

function getEpsilon(responses) {
  const keys = Object.keys(responses).sort();
  let str = "";
  keys.forEach(k => str += responses[k]);
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; 
  }
  
  const seed = Math.abs(hash) % 1000 / 1000; 
  return 0.12 + (seed * (0.47 - 0.12)); 
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// --- 1b. PERCENTILE-VS-ASPIRANTS ---
// A *deterministic* function of the student's own JSS — not random. Models
// the realistic spread of aspirants who take this diagnostic (mean ~38,
// std ~16 — most self-selecting into a "reality check" quiz are still
// mid-prep, not toppers), so a moderate JSS can honestly rank well against
// this specific population even while still being far from elite JEE
// readiness (a separate, stricter comparison already captured by
// expected/potential percentile above). Clamped to [3, 97] so it never
// claims an absolute "everyone" or "no one".
function erf(x) {
  // Abramowitz-Stegun approximation (accurate to ~1.5e-7)
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

// --- 1c. DIAGNOSED-STATUS COPY PER BREAKDOWN CATEGORY ---
// Short, specific-sounding diagnostic text per category, tiered by how
// much of that category's max points were earned — mirrors the tone of
// "56% Covered (Needs Core Focus)" style labels.
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
  
  // A. INPUTS & INDICES
  const getQ = (qid) => normalize(responses[qid]);

  const EI = 0.35 * getQ("q1") + 0.35 * getQ("q8") + 0.15 * getQ("q2") + 0.15 * getQ("q9");
  const avgPCM = (getQ("q4") + getQ("q5") + getQ("q6")) / 3;
  const CI = 0.4 * getQ("q3") + 0.2 * avgPCM;
  const REI = 0.6 * getQ("q7") + 0.4 * getQ("q10");
  const SI = (getQ("q11") + getQ("q13") + getQ("q14") + getQ("q15") + getQ("q16")) / 5;

  // B. BASELINE PERCENTILE (P_base)
  const pBaseMap = [98.2, 93.4, 82.6, 63.8];
  const q18Idx = Number(responses["q18"] || 3);
  const P_base = pBaseMap[q18Idx] !== undefined ? pBaseMap[q18Idx] : 63.8;

  // C. JEE SOCIETY SCORE (JSS)
  let JSS = 100 * (0.30 * EI + 0.25 * CI + 0.20 * REI + 0.15 * (P_base / 100) + 0.10 * SI);
  JSS = clamp(JSS, 0, 100);

  // D. TIME PATH SPLIT (Q17: 0 -> JEE 2027, 1 -> JEE 2028)
  const q17Idx = Number(responses["q17"] || 0);
  const attemptType = q17Idx === 0 ? "2027" : "2028";
  
  const epsilon = getEpsilon(responses);
  
  let P_expected = 0;
  let Expected_Range = [0, 0];
  let P_potential = 0;
  let Potential_Range = [0, 0];

  if (attemptType === "2027") {
    // === CASE A: JEE 2027 (~10 Months Left) ===
    // Syllabus (CI) and Errors (REI) hold significant weight now.
    
    // 5. Expected
    const F_27 = 0.40*EI + 0.35*CI + 0.15*REI + 0.10*SI;
    const DeltaE_27 = 14 * F_27; // Moderate growth multiplier
    
    if (P_base < 95) {
      P_expected = Math.min(95.5, P_base + DeltaE_27) + epsilon;
    } else {
      P_expected = Math.min(98.8, P_base + 0.6 * DeltaE_27) + epsilon;
    }
    
    Expected_Range = [P_expected - 2.0, P_expected + 2.0];

    // 6. Potential
    const G_27 = 0.50*EI + 0.35*CI + 0.15*REI;
    const P_raw_27 = 98.2 + 1.4*G_27 + 0.04*(P_base - 70);
    P_potential = clamp(P_raw_27 + epsilon, 97.5, 99.6);
    
    Potential_Range = [P_potential - 1.4, P_potential + 1.4];

  } else {
    // === CASE B: JEE 2028 (~22 Months Left) ===
    // Syllabus (CI) matters less since they just started. Daily habits (EI) and Stability (SI) dominate.
    
    // 7. Expected
    const F_28 = 0.50*EI + 0.15*CI + 0.15*REI + 0.20*SI; 
    const DeltaE_28 = 22 * F_28; // Massive time runway allows for huge potential growth
    
    P_expected = Math.min(97.8, P_base + DeltaE_28) + epsilon;
    Expected_Range = [P_expected - 2.8, P_expected + 2.8]; // Wider range because 2 years is unpredictable

    // 8. Potential
    // If they fix habits now, they can practically hit the ceiling.
    const G_28 = 0.60*EI + 0.10*CI + 0.15*REI + 0.15*SI;
    const P_raw_28 = 98.5 + 1.4*G_28 + 0.02*(P_base - 50);
    P_potential = clamp(P_raw_28 + epsilon, 98.8, 99.9); // Cap raised to 99.9
    
    Potential_Range = [P_potential - 1.0, P_potential + 1.0];
  }

  // 9. GLOBAL SAFETY CONSTRAINTS
  const format = (n) => Number(n.toFixed(2));
  
  if (P_expected > P_potential) {
    console.warn("Adjusting P_expected to match P_potential");
    P_expected = P_potential - 0.1;
  }

  // MANIFEST KEY MAPPING
  function mapAnswersToManifest(responses) {
    const out = {};
    Object.keys(responses).forEach(k => {
      if (k.startsWith("q")) {
        const qNum = k.substring(1);
        const idx = Number(responses[k]);
        const letter = ["A","B","C","D"][idx] || "D";
        out[k] = `Q${qNum}_${letter}`;
      }
    });
    return out;
  }

  const manifestKeys = mapAnswersToManifest(responses);

  // --- BREAKDOWN: the 5 weighted terms above, expressed as earned/max
  // points that ALWAYS sum to JSS exactly (30+25+20+15+10 = 100). ---
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