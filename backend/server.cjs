const express = require("express");
const cors = require("cors");
const generatePDF = require("./generateReportPDF.cjs");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-dynamic-report", async (req, res) => {
  try {
    console.log("Incoming admin request to generate PDF for:", req.body.name);

    // 1. Generate the PDF buffer
    const pdf = await generatePDF(req.body);

    // 2. Set headers to tell the browser this is a downloadable file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="JEEsociety_Report_${req.body.name || "Student"}.pdf"`
    );

    // 3. Send the raw PDF data back to the admin's browser
    res.send(pdf);

    console.log("✅ PDF successfully generated and sent to client.");

  } catch (err) {
    console.error("ERROR in PDF Pipeline:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Cloud Run requires listening on process.env.PORT and binding to "0.0.0.0"
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});