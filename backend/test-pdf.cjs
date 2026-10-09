const fs = require("fs");
const path = require("path");
const generatePDF = require("./generateReportPDF.cjs");

// Mock assessment submission data
const mockData = {
  studentName: "Akshansh",
  attemptType: "2027",
  score: 39,
  readinessGap: 61,
  answers: {
    q1: "Q1_A",
    q2: "Q2_B",
    q3: "Q3_B",
    q4: "Q4_B", // Physics
    q5: "Q5_C", // Chemistry
    q6: "Q6_D", // Maths
    q7: "Q7_B", // Triggers Recall analysis
    q8: "Q8_B", // Triggers Solving speed analysis
    q9: "Q9_A",
    q10: ["Q10_A", "Q10_C"], // Multi-select error patterns
    q11: "Q11_A", // Triggers Core Behavioral Block
    q12: "Q12_B",
    q13: "Q13_A", // Fills Health Card 1
    q14: "Q14_B", // Fills Energy Card 2
    q15: "Q15_A", // Fills Environment Card 3
    q16: "Q16_B", // Fills Parents/Support Card 4
    q17: "2027",
    q18: "Q18_C",
    q19: "Q19_B",
    q20: "Q20_A"
  }
};

async function runTest() {
  console.log("⏳ Generating local PDF...");
  const startTime = Date.now();

  try {
    const pdfBuffer = await generatePDF(mockData);
    const outputPath = path.join(__dirname, "test_report.pdf");

    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ Success! PDF saved in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
    console.log(`📁 File location: ${outputPath}`);
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
  }
}

runTest();