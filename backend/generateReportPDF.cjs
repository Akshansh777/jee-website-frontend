const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const solutionManifest = require("./solutionManifest.json");

// ---------- helpers ----------
function imgToBase64(imgPath) {
  try {
    if (fs.existsSync(imgPath)) {
      const img = fs.readFileSync(imgPath);
      return `data:image/png;base64,${img.toString("base64")}`;
    }
  } catch (e) {
    console.warn("Failed to load image:", imgPath);
  }
  return ""; 
}

function get(qKey, data) {
  if (data.dynamicText && data.dynamicText[qKey]) {
    return { mentor_note: data.dynamicText[qKey] };
  }
  const code = data.manifestKeys?.[qKey];
  return solutionManifest[code] || {};
}

function joinMentorNotes(keys, data) {
  return keys
    .map(k => get(k, data)?.mentor_note || "")
    .filter(Boolean)
    .join("<br><br>");
}

// ---------- main ----------
async function generatePDF(data) {

  const attemptType = data.target_attempt && data.target_attempt.includes("2028") ? "2028" : "2027";
  const prevYearChapters = attemptType === "2028" ? "2027" : "2026"; 

  const score = parseInt(data.jee_society_score) || 60;
  const readinessGap = 100 - score;
  const studentName = data.name || "Student";

  function getAsset(name) {
    return imgToBase64(path.resolve(__dirname, `assets/${name}`));
  }

  const images = {
    p1: getAsset("page1_cover.png"),
    p2: getAsset("page2_diagnostics.png"),
    p3: getAsset("page3_subjects.png"),
    p4: getAsset("page4_mapping_2028.png"),
    p5: getAsset("page5_peer.png"),
    p6: getAsset("page6_ref.png"),
    p7: getAsset("page7_health.png"),
    p8: getAsset("page8_exec.png"),
    p9: getAsset("page9_parents.png"),
    p10: getAsset("page10_roadmap_2028.png"),
    p11: getAsset("page11_conclusion.png"),
    p12: getAsset("page12_habit.png"),
    p13: getAsset("page13_mock.png"),
    physics: getAsset(`physics_${prevYearChapters}.png`),
    chemistry: getAsset(`chemistry_${prevYearChapters}.png`),
    maths: getAsset(`maths_${prevYearChapters}.png`)
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  const customSteps = [];
  const priorityKeys = ["q11", "q10", "q2", "q3", "q4", "q1", "q9"];

  for (let key of priorityKeys) {
    const code = data.manifestKeys?.[key];
    if (code && solutionManifest[code] && solutionManifest[code].action_24h) {
      customSteps.push(solutionManifest[code].action_24h);
    }
  }
  
  if (customSteps.length < 7) {
    for (let key of priorityKeys) {
      const code = data.manifestKeys?.[key];
      if (code && solutionManifest[code] && solutionManifest[code].action_7d) {
        customSteps.push(solutionManifest[code].action_7d);
      }
    }
  }
  
  while (customSteps.length < 7) { customSteps.push("Stay consistent and review your error log daily."); }
  
  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap');

body { margin:0; padding:0; background:white; font-family:'Nunito', sans-serif; }
.page { page-break-after: always; position: relative; height: 1120px; width: 793px; overflow: hidden; }
.page:last-child { page-break-after: auto; }
.bg-img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; z-index: 1; }
.content-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; }

/* Global Text Styles */
.dynamic-text { position: absolute; font-size: 17px; font-weight: 700; color: #222; }

/* PAGE 1: COVER (Cleaned up coordinates) */
.p1-name{ top: 733px; left: 187px; font-size: 20px; font-weight: 700; }
.p1-target{ top: 773px; left: 191px; font-size: 18px; font-weight: 700; }
.p1-score{ top: 813px; left: 331px; font-size: 18px; font-weight: 700; }

/* PAGE 2: DIAGNOSTICS (Cleaned up graph) */
.p2-score { top: 123px; left: 65px; font-size: 25px; color: #a40000; font-weight: 800; }
.p2-gap { top: 195px; left: 116px; font-size: 27px; color: #a40000; }

/* PAGE 3: SUBJECTS */
.subj-box { position: absolute; font-size: 15px; line-height: 1.6; max-width: 320px; color: #333; }
.p3-physics { top: 323px; left: 53px; width: 321px; max-width: none; }
.p3-maths { top: 759px; left: 53px; width: 321px; max-width: none; }
.p3-chemistry { top: 323px; left: 429px; width: 321px; max-width: none; }

/* PAGE 5: PEER COMPARISON */
.p5-score-top { top: 164px; left: 466px; font-size: 22px; color: #a40000; }

/* PAGE 6: R.E.F & BARRIER */
.p6-ref { top: 230px; left: 90px; width: 610px; line-height: 1.7; color: #4a0402; }
.p6-barrier { top: 780px; left: 90px; width: 610px; line-height: 1.7; color: #4a0402; }

/* PAGE 7: HEALTH */
.health-item { position: absolute; left: 90px; width: 610px; line-height: 1.6; color: #4a0402; font-size: 16px; }
.h-item1 { top: 195px; }
.h-item2 { top: 405px; }
.h-item3 { top: 625px; }
.h-item4 { top: 835px; }

/* PAGE 8: EXECUTION PLAN */
.exec-item { position: absolute; left: 140px; width: 550px; font-size: 15px; line-height: 1.5; color: #4a0402; font-weight: 600; }
.ex1 { top: 292px; }
.ex2 { top: 405px; }
.ex3 { top: 518px; }
.ex4 { top: 631px; }
.ex5 { top: 744px; }
.ex6 { top: 857px; }
.ex7 { top: 970px; }

/* PAGE 11: CONCLUSION */
.p11-conc { top: 390px; left: 140px; width: 520px; font-size: 20px; line-height: 1.8; color: #5c1a1a; }

/* =========================================
   THE MASKING ENGINE (White & Black Boxes)
   ========================================= */
.black-mask { 
  position: absolute; background: #000; color: #ffd700; font-weight: 900; 
  text-align: center; font-size: 32px; z-index: 20; top: 57px; left: 141px; 
  width: 130px; height: 45px; line-height: 45px; border-radius: 8px;
}
.white-mask { 
  position: absolute; background: white; z-index: 20; top: 93px; left: 42px; 
  width: 680px; height: 55px; 
}
.mask-text {
  position: absolute; z-index: 21; font-size: 15px; font-weight: 700;
  color: #333; top: 145px; left: 70px; line-height: 1.6;
}
</style>
</head>
<body>

<div class="page">
  <img src="${images.p1}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="dynamic-text p1-name">${studentName}</div>
    <div class="dynamic-text p1-target">JEE ${attemptType}</div>
    <div class="dynamic-text p1-score">${score}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p2}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="dynamic-text p2-score">${score}</div>
    <div class="dynamic-text p2-gap">${readinessGap}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p3}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="subj-box p3-physics">${get("q4", data)?.mentor_note || "Physics note..."}</div>
    <div class="subj-box p3-maths">${get("q6", data)?.mentor_note || "Maths note..."}</div>
    <div class="subj-box p3-chemistry">${get("q5", data)?.mentor_note || "Chemistry note..."}</div>
  </div>
</div>

${attemptType === "2028" ? `
<div class="page">
  <img src="${images.p4}" class="bg-img" onerror="this.style.display='none'"/>
</div>
` : ""}

<div class="page">
  <img src="${images.p6}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="dynamic-text p6-ref">${joinMentorNotes(["q7","q8","q10"], data)}</div>
    <div class="dynamic-text p6-barrier">
      ${get("q11", data)?.mentor_note || "Barrier notes..."}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p7}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="health-item h-item1">${get("q13", data)?.mentor_note || ""}</div>
    <div class="health-item h-item2">${get("q14", data)?.mentor_note || ""}</div>
    <div class="health-item h-item3">${get("q15", data)?.mentor_note || ""}</div>
    <div class="health-item h-item4">${get("q16", data)?.mentor_note || ""}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p8}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="exec-item ex1"><b>Step 1:</b> ${customSteps[0]}</div>
    <div class="exec-item ex2"><b>Step 2:</b> ${customSteps[1]}</div>
    <div class="exec-item ex3"><b>Step 3:</b> ${customSteps[2]}</div>
    <div class="exec-item ex4"><b>Step 4:</b> ${customSteps[3]}</div>
    <div class="exec-item ex5"><b>Step 5:</b> ${customSteps[4]}</div>
    <div class="exec-item ex6"><b>Step 6:</b> ${customSteps[5]}</div>
    <div class="exec-item ex7"><b>Step 7:</b> ${customSteps[6]}</div>
  </div>
</div>

${images.physics ? `
<div class="page">
  <img src="${images.physics}" class="bg-img"/>
  ${attemptType === "2027" ? `<div class="black-mask bm-physics">${attemptType}</div>` : ""}
</div>` : ""}

${images.chemistry ? `
<div class="page">
  <img src="${images.chemistry}" class="bg-img"/>
  ${attemptType === "2027" ? `<div class="black-mask bm-physics">${attemptType}</div>` : ""}
</div>` : ""}

${images.maths ? `
<div class="page">
  <img src="${images.maths}" class="bg-img"/>
  ${attemptType === "2027" ? `<div class="black-mask bm-physics">${attemptType}</div>` : ""}
</div>` : ""}

<div class="page">
  <img src="${images.p9}" class="bg-img" onerror="this.style.display='none'"/>
</div>

${attemptType === "2028" ? `
<div class="page">
  <img src="${images.p10}" class="bg-img" onerror="this.style.display='none'"/>
</div>
` : ""}

<div class="page">
  <img src="${images.p11}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="dynamic-text p11-conc">
      <span style="font-size: 22px; font-weight: 900; color: #a40000;">
        ${get("q18", data)?.one_line || "Final Verdict"}
      </span><br><br>
      ${get("q18", data)?.mentor_note || "Focus on your barriers and execute the plan consistently."}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p12}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="white-mask wm-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target: ${attemptType}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p13}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="white-mask wm-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target: ${attemptType}
    </div>
  </div>
</div>

</body>
</html>
  `;

  await page.setContent(html, { waitUntil: "load", timeout: 60000 });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
}

module.exports = generatePDF;