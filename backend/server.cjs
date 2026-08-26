const express = require("express");
const cors = require("cors");
const generatePDF = require("./generateReportPDF.cjs");

const app = express();

// 1. Explicit CORS configuration for mobile browsers & preflight requests
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Disposition"],
  })
);

// 2. Bump JSON payload limit to prevent 413 Payload Too Large drops
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 3. Health check route (useful for Cloud Run cold-start pings)
app.get("/", (req, res) => {
  res.status(200).send("JEEsociety Report Backend is Healthy and Running 🚀");
});

app.post("/send-dynamic-report", async (req, res) => {
  try {
    const rawName = req.body.name || "Student";
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");

    console.log(`Incoming request to generate PDF for: ${rawName}`);

    // 1. Generate the PDF buffer
    const pdf = await generatePDF(req.body);

    // 2. Set headers safely
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="JEEsociety_Report_${sanitizedName}.pdf"`
    );
    res.setHeader("Content-Length", pdf.length);

    // 3. Send raw PDF buffer
    res.status(200).end(pdf);

    console.log(`✅ PDF successfully generated and sent for ${rawName}.`);
  } catch (err) {
    console.error("ERROR in PDF Pipeline:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Cloud Run requires listening on process.env.PORT and binding to 0.0.0.0
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});