const fs = require("fs");
const path = require("path");
const generatePDF = require("./generateReportPDF.cjs");

const mockStudent = {
  name: "Arjun Sharma",
  target_attempt: "2027",
  jee_society_score: 62,
  answers: {
    name: "Arjun Sharma",
    q1: "0",
    q2: "1",
    q3: "1",
    q4: "1", // Physics: Average (Freezes on new problems)
    q5: "1", // Chemistry: Volatile (Forgets reactions)
    q6: "2", // Maths: Phobia (Struggles with basics)
    q7: "0",
    q8: "1",
    q9: "0",
    q10: "1",
    q11: "0",
    q13: "1",
    q14: "0",
    q15: "1",
    q16: "0",
    q17: "0",
    q18: "0",
    q19: "2"
  },
  manifestKeys: {
    q1: "Q1_A",
    q2: "Q2_B",
    q3: "Q3_B",
    q4: "Q4_B",
    q5: "Q5_B",
    q6: "Q6_C",
    q7: "Q7_A",
    q8: "Q8_B",
    q9: "Q9_A",
    q10: "Q10_B",
    q11: "Q11_A",
    q13: "Q13_B",
    q14: "Q14_A",
    q15: "Q15_B",
    q16: "Q16_A",
    q17: "Q17_A",
    q18: "Q18_A",
    q19: "Q19_C"
  }
};

async function createSample() {
  console.log("Rendering sample report...");
  try {
    const pdfBuffer = await generatePDF(mockStudent);
    const outputPath = path.resolve(__dirname, "Sample_JEEsociety_Report.pdf");
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ Success! Sample PDF saved to: ${outputPath}`);
  } catch (err) {
    console.error("❌ Error generating sample PDF:", err);
  }
}

createSample();