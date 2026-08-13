/**
 * TEST SCRIPT — run this locally to generate a sample PDF and actually
 * see the rendered output, instead of guessing from the code.
 *
 * SETUP:
 * 1. Place this file in the same folder as generateReportPDF.cjs
 *    (i.e. your backend/ folder, next to solutionManifest.json and assets/)
 * 2. Run: node test-generate.js
 * 3. Open the resulting test-output.pdf in your PDF viewer
 *
 * Edit SAMPLE_PAYLOAD below to test different scenarios — e.g. change
 * answers.q2 / answers.q19 to see the Rank Degradation Warning switch
 * between the "at risk" (red) and "stable" (green) variants, or change
 * jee_society_score to see the cover page score change.
 */

const fs = require("fs");
const generatePDF = require("./generateReportPDF.cjs");

const SAMPLE_PAYLOAD = {
  name: "Test Student",
  target_attempt: "JEE 2027",

  // Try flipping these to see the Rank Degradation Warning change:
  // q2: 0 or 1 = "stable" (green) variant, q2: 2 or 3 = "at risk" (red) variant
  // q19: 0 or 1 = leans passive (also triggers "at risk"), q19: 2 or 3 = active solver
  answers: {
    q1: 2,
    q2: 2,        // "Passive Consumption" bracket — should trigger the RED warning
    q3: 1,
    q4: 2,
    q5: 1,
    q6: 2,
    q7: 2,
    q8: 3,
    q9: 1,
    q10: 1,
    q11: 0,
    q12: 1,
    q13: 1,
    q14: 0,
    q15: 2,
    q16: 1,
    q17: 0,
    q18: 2,
    q19: 0,       // "80% Lectures / 20% Solving" — also leans "at risk"
    q20: 0,
    name: "Test Student",
  },

  jee_society_score: 48,

  // NOTE: these are [low, high] ranges in the real payload, but the
  // Rank Degradation Warning no longer reads these at all (removed per
  // your request) — left here only because other pages (page 2, etc.)
  // might still reference score directly. Harmless either way.
  expected_percentile: [55, 59],
  potential_percentile: [70, 74],

  swot: {
    strengths: "Sample strength text for testing.",
    weaknesses: "Sample weakness text for testing.",
    opportunities: "Sample opportunity text for testing.",
    threats: "Sample threat text for testing.",
  },

  recommendations: "Focus on your flagged weaknesses.",

  manifestKeys: {
    // Fill these in with real codes from your solutionManifest.json if
    // you want to see real mentor_note / action_24h / action_7d text
    // instead of the generic fallback strings.
  },

  // Sent by the frontend now, but no longer used by the checklist (it's
  // self-fill now) — harmless to leave in or omit.
  breakdown: [],
};

(async () => {
  console.log("Generating test PDF...");
  try {
    const pdfBuffer = await generatePDF(SAMPLE_PAYLOAD);
    fs.writeFileSync("test-output.pdf", pdfBuffer);
    console.log("✅ Done — open test-output.pdf to see the result.");
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
  }
})();