const fs = require("fs");
const path = require("path");

// Robust loader in case generateReportPDF exports directly or as a named object
const pdfModule = require("./generateReportPDF.cjs");
const generatePDF = typeof pdfModule === "function"
  ? pdfModule
  : (pdfModule.generatePDF || pdfModule.generateReportPDF || Object.values(pdfModule)[0]);

// Your exact test answers
const answers = {
  q1: "Q1_A",
  q2: "Q2_B",
  q3: "Q3_B",
  q4: "Q4_B", // Physics -> Option B (Avg ~55 marks)
  q5: "Q5_C", // Chemistry -> Option C (Weak ~25 marks)
  q6: "Q6_D", // Maths -> Option D (Ego Lifter ~38 marks)
  q7: "Q7_B", // Triggers Recall analysis
  q8: "Q8_B", // Triggers Solving speed analysis
  q9: "Q9_A",
  q10: ["Q10_A", "Q10_C"], // Multi-select error patterns
  q11: "Q11_A", // Triggers Core Behavioral Block
  q12: "Q12_B",
  q13: "Q13_A",
  q14: "Q14_B",
  q15: "Q15_A",
  q16: "Q16_B",
  q17: "2027",
  q18: "Q18_C",
  q19: "Q19_B",
  q20: "Q20_A"
};

// Auto-derive manifestKeys from answers so generateReportPDF gets all notes
const manifestKeys = {};
Object.keys(answers).forEach((key) => {
  if (key.startsWith("q")) {
    manifestKeys[key] = answers[key];
  }
});

const mockData = {
  name: "Akshansh",
  studentName: "Akshansh",
  jee_society_score: 38,
  target_attempt: "JEE 2027",
  attemptType: "2027",
  answers: answers,
  manifestKeys: manifestKeys,
  swot: {
    strengths: "Consistent daily effort during good weeks.",
    weaknesses: "Revision debt causing formula leaks in mock tests.",
    opportunities: "High-yield topics in Modern Physics and Physical Chemistry.",
    threats: "Screen distractions and unstructured test-hall strategy."
  }
};

async function runTest() {
  console.log("⏳ Compiling test PDF report...");
  const startTime = Date.now();

  try {
    const pdfBuffer = await generatePDF(mockData);
    const outputPath = path.join(__dirname, "test_report.pdf");

    fs.writeFileSync(outputPath, pdfBuffer);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Success! PDF generated in ${elapsed}s`);
    console.log(`📁 Saved to: ${outputPath}`);
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
  }
}

runTest();