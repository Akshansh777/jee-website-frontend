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

// --- HELPER: Forward lead data to main website's PHP/MySQL CRM ---
async function forwardLeadToPHP(payload, defaultStatus = "free_offer", defaultAmount = 0) {
  try {
    const postData = {
      name: payload.name || "Aspirant",
      phone: payload.phone || "",
      email: payload.email || "",
      score: Number(payload.jee_society_score || payload.score || 0),
      target_attempt: String(payload.target_attempt || payload.attemptType || "2026"),
      // Must be one of: "paid", "free_offer", "unpaid_dropoff"
      payment_status: payload.payment_status || defaultStatus,
      amount: Number(payload.amount !== undefined ? payload.amount : defaultAmount),
      answers: payload.answers || {}
    };

    console.log(`[CRM] Forwarding lead: ${postData.name} | ${postData.phone} | Status: ${postData.payment_status}`);

    const response = await fetch("https://jeesociety.in/save-report-lead.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    const result = await response.json().catch(() => null);
    console.log("[CRM] PHP Response:", result);
    return result;
  } catch (err) {
    console.error("[CRM Error] Could not forward lead to PHP:", err.message);
    return null;
  }
}

// 3. Health check route (useful for Cloud Run cold-start pings)
app.get("/", (req, res) => {
  res.status(200).send("JEEsociety Report Backend is Healthy and Running 🚀");
});

// 4. Standalone endpoint to capture lead early (e.g., when modal opens/submits)
app.post("/api/capture-lead", async (req, res) => {
  try {
    const status = req.body.payment_status || "unpaid_dropoff";
    const amount = req.body.amount || 0;
    const result = await forwardLeadToPHP(req.body, status, amount);
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Lead capture failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Main report generation & lead completion endpoint
app.post("/send-dynamic-report", async (req, res) => {
  try {
    const rawName = req.body.name || "Student";
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_-]/g, "_");

    console.log(`Incoming request to generate PDF for: ${rawName}`);

    // Forward completed report lead in background
    const finalPaymentStatus = req.body.payment_status || "free_offer";
    const finalAmount = req.body.amount || 0;
    forwardLeadToPHP(req.body, finalPaymentStatus, finalAmount);

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