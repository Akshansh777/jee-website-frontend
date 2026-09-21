const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const solutionManifest = require("./solutionManifest.json");

// ---------- helpers (UPDATED FOR MULTI-SELECT ARRAYS) ----------
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

  // Handle Multi-Select Arrays (Q10, Q11, Q12, Q13, Q15)
  if (Array.isArray(code)) {
    if (code.length === 0) return {};
    const notes = code
      .map((c) => solutionManifest[c]?.mentor_note)
      .filter(Boolean)
      .join("<br><br>");
    const oneLines = code
      .map((c) => solutionManifest[c]?.one_line)
      .filter(Boolean)
      .join(" • ");

    return { 
      mentor_note: notes,
      one_line: oneLines 
    };
  }

  // Handle Standard Single Choice String
  return solutionManifest[code] || {};
}

function joinMentorNotes(keys, data) {
  return keys
    .map((k) => get(k, data)?.mentor_note || "")
    .filter(Boolean)
    .join("<br><br>");
}

// =========================================================
// SUBJECT DEEP-DIVE PAGES (Physics / Chemistry / Maths)
// =========================================================
const MARKS_ESTIMATE = {
  physics: [72, 52, 28, 65],
  chemistry: [75, 45, 25, 50],
  maths: [70, 40, 15, 35],
};

const SUBJECT_QUESTION_KEY = { physics: "q4", chemistry: "q5", maths: "q6" };
const SUBJECT_LABEL = { physics: "Physics", chemistry: "Chemistry", maths: "Maths" };

function estimateMarks(subject, idx) {
  const arr = MARKS_ESTIMATE[subject];
  return arr[idx] !== undefined ? arr[idx] : 45;
}

const SUBJECT_AFFIRMATION = {
  physics: "Physics is already your anchor. Protect it, don't let it quietly eat time that Chemistry or Maths actually needs.",
  chemistry: "Chemistry is already working for you. Keep the revision light and consistent, don't let it slip while you focus elsewhere.",
  maths: "You're already ahead of most aspirants in Maths. Push for 90+ instead of \"good enough\", it's the subject NTA checks first in a tie.",
};

const CASE_STUDIES = {
  physics: {
    1: {
      story: "One student from our mentorship program was in a similar spot with Physics. He was scoring consistently 45-50 out of 100 for months, he understood every concept in class, but froze the moment a question looked unfamiliar in mocks. We didn't add more theory. We had him solve 15 previous-year Physics questions daily from just 4 chapters, Rotational Motion, Electrostatics, Current Electricity, and Modern Physics, without watching a single new lecture. Three weeks later his Physics score was 68/100. He wasn't missing knowledge. He was missing exposure to how JEE actually twists standard concepts.",
      takeaway: "Lesson for you: stop watching more lectures. You already know the theory. Solve 15 PYQs a day from your weakest 4 chapters before touching anything new.",
    },
    2: {
      story: "I had a student last year who was convinced he \"just wasn't a Physics person.\" He was scoring under 20 out of 100. We checked his basics instead, Vectors, Units and Dimensions, Kinematics, all shaky. We stopped him from touching Modern Physics or Electrostatics for 3 weeks. Pure NCERT-level basics, nothing else. When he came back to the harder chapters, they suddenly made sense. He jumped to 44/100 in the very next mock.",
      takeaway: "Lesson for you: you're not bad at Physics. You're missing the foundation Physics is built on. Go back to Vectors and Kinematics before anything else.",
    },
    3: {
      story: "One mentee of ours was already scoring 78 out of 100 in Physics and kept spending four or more hours a day on it anyway, because it felt productive and he genuinely enjoyed it. Meanwhile his Chemistry sat at 30/100. We capped his Physics time at 45 minutes a day, revision only, no new content, and moved those hours to Chemistry. His Physics score barely moved, 79 to 81. His Chemistry jumped from 30 to 58 in six weeks.",
      takeaway: "Lesson for you: the subject you love most is probably not the one costing you the most marks. Cap your time on it and redirect the hours to whichever subject you're avoiding.",
    },
  },
  chemistry: {
    1: {
      story: "One student told us Chemistry kept slipping through his fingers. He could recall a reaction perfectly the day after studying it, and completely forget it three days later. His Chemistry score swung between 25 and 60 depending on how recently he'd revised. We put him on a strict cycle, revisit every topic on Day 1, Day 3, and Day 7 after first studying it, no exceptions. Six weeks later his lowest Chemistry mock score was 55, and it stopped swinging.",
      takeaway: "Lesson for you: your problem isn't understanding, it's retention. Fixed-interval revision, Day 1, 3, 7, matters more than how many new topics you cover.",
    },
    2: {
      story: "One of our mentees avoided Chemistry almost entirely, barely opened the book, and was scoring under 15 out of 100. We didn't ask him to love it. We picked the single highest-yield, lowest-effort chapter, Chemical Bonding, gave him just the NCERT lines and 20 PYQs, nothing else. He scored 14 out of 20 on those questions on his first attempt, his first real win in Chemistry in months. That one win changed how he approached the whole subject.",
      takeaway: "Lesson for you: you don't need to fix your relationship with Chemistry. You need one small, fast win to prove to yourself you can actually do this.",
    },
    3: {
      story: "A student of ours was almost perfect in half of Chemistry, near-perfect on Mole Concept and Thermodynamics, but scored almost zero on Organic reaction mechanisms, he treated them as impossible to memorize. We reframed Organic as logic, not memory, six reaction families instead of two hundred individual reactions. Within a month his Organic-specific score went from 8 out of 40 to 26 out of 40.",
      takeaway: "Lesson for you: your strong half is fine, don't touch it. Your weak half needs a different strategy. Most likely you're studying it the wrong way, not too little.",
    },
  },
  maths: {
    1: {
      story: "One mentee of ours only ever touched the safe chapters in Maths, Vectors, 3D Geometry, Straight Lines, and skipped everything else. He was hard-capped at 45 out of 100 no matter what. We had him add one new chapter every 10 days, starting with Permutations and Combinations. His ceiling broke for the first time in months, 45 became 58, then 64.",
      takeaway: "Lesson for you: your safe zone has a hard ceiling. Every chapter you refuse to touch is a ceiling you've built yourself.",
    },
    2: {
      story: "One student of ours was in your exact spot. Maths felt impossible, he'd scored 12 out of 100 for two straight mocks and was ready to write it off completely. We didn't ask him to love Maths. We asked him to master exactly 4 chapters, Quadratic Equations, Sets and Relations, Statistics, and Straight Lines, the most formula-based, least \"clever-thinking-required\" chapters in the syllabus. Six weeks later his Maths score was 46 out of 100. His overall percentile moved more from that than from anything he did in Physics or Chemistry that term.",
      takeaway: "Lesson for you: stop trying to complete the full Maths syllabus. Target the 4 chapters above first, they reward formula-memorization, not genius, and they're worth real marks.",
    },
    3: {
      story: "I've seen this pattern often. A mentee would spend 25 minutes on a single hard integration problem on principle, refusing to move on, while three easy Matrices questions worth the same total marks sat untouched. We stopped him from attempting anything he couldn't solve in under 3 minutes during practice, no exceptions, for two weeks. His accuracy on easy-to-medium questions went from 60% to 91%, and his Maths score jumped 22 points without him getting any \"smarter\" at all.",
      takeaway: "Lesson for you: JEE gives the same marks for an easy question and a hard one. Chasing the hard ones to prove something is costing you marks you could get for free.",
    },
  },
};

function getSubjectContent(subject, idx) {
  if (idx === 0) {
    return { isAffirmation: true, text: SUBJECT_AFFIRMATION[subject] };
  }
  const cs = CASE_STUDIES[subject][idx];
  return { isAffirmation: false, ...(cs || CASE_STUDIES[subject][1]) };
}

function detectCompensation(subject, marksBySubject) {
  const others = Object.keys(marksBySubject).filter((k) => k !== subject);
  const otherAvg = others.reduce((sum, k) => sum + marksBySubject[k], 0) / others.length;
  const gap = otherAvg - marksBySubject[subject];
  if (gap < 20) return null;

  const strongerSubject = others.reduce((a, b) => (marksBySubject[a] > marksBySubject[b] ? a : b));
  return {
    gap: Math.round(gap),
    strongerLabel: SUBJECT_LABEL[strongerSubject],
    weakerLabel: SUBJECT_LABEL[subject],
  };
}

function buildTieBreakInsight(subject) {
  if (subject === "maths") {
    return `Because thousands of aspirants land on near-identical total scores every year, ties are common. When they happen, NTA resolves them using <b>Maths score first</b>, before Physics or Chemistry are even considered. A weak Maths score doesn't just cost you marks directly, it also puts you at a real disadvantage against equally-scored peers when final ranks get assigned.`;
  }
  if (subject === "physics") {
    return `If your total score ties with another aspirant's, NTA checks Maths first, then <b>Physics second</b>. Physics is your tie-break safety net, worth strengthening even beyond what your total score alone suggests.`;
  }
  return `Chemistry is checked last in NTA's tie-break order (after Maths, then Physics), but with lakhs of aspirants landing on similar totals, even a "last resort" tie-breaker resolves real ranks every single year.`;
}

// --- Combined "Where You Stand" + "Peer Reference" Gauge ---
function buildCombinedStandGauge(marks, subjectLabel) {
  const pct = Math.max(6, Math.min(94, marks));
  const avgPct = 45;
  const topPct = 90;

  return `
    <div style="margin-bottom: 20px;">
      <div style="font-size: 16px; font-weight: 800; color: #111; margin-bottom: 12px; letter-spacing: -0.2px;">
        Where You Stand: ${subjectLabel}
      </div>
      
      <div style="position: relative; margin-top: 24px; margin-bottom: 12px;">
        <div style="height: 12px; border-radius: 6px; background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 25%, #eab308 55%, #f97316 80%, #ef4444 100%); position: relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);">
          <div style="position: absolute; left: ${avgPct}%; top: -3px; bottom: -3px; width: 2px; background: rgba(0,0,0,0.5); z-index: 2;"></div>
          <div style="position: absolute; left: ${topPct}%; top: -3px; bottom: -3px; width: 2px; background: rgba(0,0,0,0.5); z-index: 2;"></div>
        </div>

        <div style="position: absolute; top: -26px; left: ${pct}%; transform: translateX(-50%); z-index: 5; display: flex; flex-direction: column; align-items: center;">
          <div style="background: #c62828; color: white; font-size: 11px; font-weight: 900; padding: 2px 8px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 6px rgba(198,40,40,0.35);">
            You
          </div>
          <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #c62828;"></div>
        </div>

        <div style="position: relative; height: 16px; margin-top: 6px; font-size: 11.5px; font-weight: 700;">
          <span style="position: absolute; left: 0; color: #94a3b8;">Baseline</span>
          <span style="position: absolute; left: ${avgPct}%; transform: translateX(-50%); color: #475569;">Typical Aspirant</span>
          <span style="position: absolute; left: ${topPct}%; transform: translateX(-50%); color: #b45309;">Top 1% IITians</span>
        </div>
      </div>
    </div>
  `;
}

function buildSubjectPageHTML(subject, data, marksBySubject) {
  const qKey = SUBJECT_QUESTION_KEY[subject];
  const idx = Number(data.answers?.[qKey]);
  const marks = marksBySubject[subject];
  const content = getSubjectContent(subject, idx);
  const compensation = detectCompensation(subject, marksBySubject);

  const compensationBlock = compensation ? `
    <div style="margin-bottom: 14px; font-size: 16px; font-weight: 900; color: #9a3412; line-height: 1.45;">
      ⚠️ Score Imbalance: Your ${compensation.strongerLabel} is outperforming your ${compensation.weakerLabel} by ~${compensation.gap} marks. Compensating across subjects does not work under JEE aggregate ranking.
    </div>
  ` : "";

  const caseStudyBlock = content.isAffirmation ? `
    <div class="subj-affirmation">${content.text}</div>
  ` : `
    <div class="subj-case-story">${content.story}</div>
    <div class="subj-case-takeaway">${content.takeaway}</div>
  `;

  return `
    <div class="subj-stand-wrap">
      ${buildCombinedStandGauge(marks, SUBJECT_LABEL[subject])}
    </div>

    <div class="subj-box-1">
      ${compensationBlock}
      <div class="subj-tiebreak-text">${buildTieBreakInsight(subject)}</div>
    </div>

    <div class="subj-box-2">
      ${caseStudyBlock}
    </div>
  `;
}

// ---------- main ----------
async function generatePDF(data) {
  const attemptType = data.target_attempt && data.target_attempt.includes("2028") ? "2028" : "2027";
  const prevYearChapters = attemptType === "2028" ? "2027" : "2026"; 

  const score = parseInt(data.jee_society_score) || 60;
  const readinessGap = 100 - score;
  const studentName = data.name || "Student";

  const marksBySubject = {
    physics: estimateMarks("physics", Number(data.answers?.q4)),
    chemistry: estimateMarks("chemistry", Number(data.answers?.q5)),
    maths: estimateMarks("maths", Number(data.answers?.q6)),
  };

  function getAsset(name) {
    return imgToBase64(path.resolve(__dirname, `assets/${name}`));
  }

  const images = {
    p1: getAsset("page1_cover.png"),
    p2: getAsset("page2_diagnostics.png"),
    p3a: getAsset("page3a_physics.png"),
    p3b: getAsset("page3b_chemistry.png"),
    p3c: getAsset("page3c_maths.png"),
    p5: getAsset("page5_peer.png"),
    p6: getAsset("page6_ref.png"),
    p6b: getAsset("page6b_mindset_systems.png"),
    p7: getAsset("page7_health.png"),
    p8: getAsset("page8_exec.png"),
    p9: getAsset("page9_parents.png"),
    p11: getAsset("page11_conclusion.png"),
    taskSubmission: getAsset("task_submission.png"),
    p12: getAsset("page12_habit.png"),
    p13: getAsset("page13_mock.png"),
    p14: getAsset("page14_mock_analysis_guide.png"),
    sundayTracker: getAsset("sunday_tracker.png"),
    mentorshipPromo: getAsset("mentorship_promo.png"),
    physics: getAsset(`physics_${prevYearChapters}.png`),
    chemistry: getAsset(`chemistry_${prevYearChapters}.png`),
    maths: getAsset(`maths_${prevYearChapters}.png`)
  };

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });
  const page = await browser.newPage();

  const customSteps = [];
  const priorityKeys = ["q11", "q10", "q2", "q3", "q4", "q1", "q9"];

  for (let key of priorityKeys) {
    const rawCode = data.manifestKeys?.[key];
    const codes = Array.isArray(rawCode) ? rawCode : [rawCode];
    for (let code of codes) {
      if (code && solutionManifest[code] && solutionManifest[code].action_24h) {
        if (!customSteps.includes(solutionManifest[code].action_24h)) {
          customSteps.push(solutionManifest[code].action_24h);
        }
      }
    }
  }

  if (customSteps.length < 7) {
    for (let key of priorityKeys) {
      const rawCode = data.manifestKeys?.[key];
      const codes = Array.isArray(rawCode) ? rawCode : [rawCode];
      for (let code of codes) {
        if (code && solutionManifest[code] && solutionManifest[code].action_7d) {
          if (!customSteps.includes(solutionManifest[code].action_7d)) {
            customSteps.push(solutionManifest[code].action_7d);
          }
        }
      }
    }
  }

  while (customSteps.length < 7) { 
    customSteps.push("Stay consistent and review your error log daily."); 
  }

  // Exact 8 items: 7 diagnostic points + 1 mentor closing
  const executionPoints = [
    ...customSteps.slice(0, 7),
    "Share this exact list with your mentor and ask them to check in on it in 7 days. Accountability from someone outside your own head changes follow-through more than willpower does."
  ];
  
// --- PAGE 6 DYNAMIC TEXT & BIGGER FONT ENGINE ---
  const refNotes = joinMentorNotes(["q7", "q8", "q10"], data);
  const barrierNotes = get("q11", data)?.mentor_note || "Focus on eliminating your core barrier with dedicated daily practice.";
  const totalP6Length = (refNotes + barrierNotes).length;

  // Base tier: Large, bold, commanding font
  let p6FontSize = "18px";
  let p6LineHeight = "1.58";
  let p6Padding = "24px 28px";
  let p6TitleMargin = "20px 0 16px";
  let p6TitleSize = "26px";

  // Graceful scaling steps if multiple multi-select options are selected
  if (totalP6Length > 2200) {
    p6FontSize = "14px";
    p6LineHeight = "1.40";
    p6Padding = "16px 22px";
    p6TitleMargin = "12px 0 10px";
    p6TitleSize = "22px";
  } else if (totalP6Length > 1650) {
    p6FontSize = "15.5px";
    p6LineHeight = "1.46";
    p6Padding = "18px 24px";
    p6TitleMargin = "15px 0 12px";
    p6TitleSize = "23px";
  } else if (totalP6Length > 1150) {
    p6FontSize = "16.8px";
    p6LineHeight = "1.52";
    p6Padding = "20px 26px";
    p6TitleMargin = "18px 0 14px";
    p6TitleSize = "24.5px";
  }

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

/* PAGE 1: COVER */
.p1-name{ top: 733px; left: 187px; font-size: 20px; font-weight: 700; }
.p1-target{ top: 773px; left: 191px; font-size: 18px; font-weight: 700; }
.p1-score{ top: 813px; left: 331px; font-size: 18px; font-weight: 700; }

/* PAGE 2: DIAGNOSTICS */
.p2-score { top: 82px; left: 65px; font-size: 24px; color: #a40000; font-weight: 800; }
.p2-gap { top: 158px; left: 116px; font-size: 25px; color: #a40000; }

/* ========================================================= */
/* CLICKABLE WEBSITE & BADGE OVERLAYS                        */
/* ========================================================= */
/* Standard Top-Left Pill (Pages 2, 6, 7, 8, 9, 11, 6b) */
.pill-link-standard {
  position: absolute;
  top: 14px;
  left: 16px;
  width: 195px;
  height: 42px;
  z-index: 100;
  display: block;
  cursor: pointer;
  background: transparent;
}

/* Page 2 Top-Right Pill Overlay */
.pill-link-top-right {
  position: absolute;
  top: 14px;
  right: 80px;
  width: 195px;
  height: 42px;
  z-index: 100;
  display: block;
  cursor: pointer;
  background: transparent;
}

/* Subject Deep-Dive Pill (Pages 3a, 3b, 3c - offset for the left doodle) */
.pill-link-subject {
  position: absolute;
  top: 14px;
  left: 134px;
  width: 195px;
  height: 42px;
  z-index: 100;
  display: block;
  cursor: pointer;
  background: transparent;
}

/* Mentorship Promo Button Overlay (Page 20) */
.promo-btn-link {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 520px;
  height: 80px;
  z-index: 100;
  display: block;
  cursor: pointer;
  background: transparent;
}

/* ========================================================= */
/* PAGES 3a/3b/3c: NATURAL-FIT, HIGH-LEGIBILITY SUBJECT CARDS*/
/* ========================================================= */
.subj-content {
  position: absolute;
  top: 170px;
  left: 50px;
  width: 693px;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Clean proportional gap between gauge and boxes */
  box-sizing: border-box;
}

.subj-stand-wrap {
  width: 100%;
}

/* Box 1: Hugs text naturally with high-contrast text */
.subj-box-1 {
  background: #FFFAE5;
  border: 2px solid #fed7aa;
  border-radius: 22px;
  padding: 22px 28px;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.subj-tiebreak-text {
  font-size: 19px;
  line-height: 1.58;
  color: #1e293b;
  font-weight: 800;
}

/* Box 2: Hugs story & takeaway with commanding bold font */
.subj-box-2 {
  background: #FFFAE5;
  border: 2px solid #fed7aa;
  border-radius: 22px;
  padding: 26px 30px;
  box-sizing: border-box;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
}

.subj-case-story {
  font-size: 18px;
  line-height: 1.62;
  color: #334155;
  margin-bottom: 16px;
  font-weight: 700;
}

.subj-case-takeaway {
  font-size: 19px;
  line-height: 1.52;
  color: #7a1010;
  font-weight: 900;
}

/* Option A Affirmation Layout */
.subj-affirmation {
  font-size: 22px;
  line-height: 1.6;
  color: #1e293b;
  font-weight: 900;
  font-style: italic;
  text-align: center;
  padding: 12px 10px;
}

/* PAGE 5: PEER COMPARISON */
.p5-score-top { top: 164px; left: 466px; font-size: 22px; color: #a40000; }

/* ========================================================= */
/* PAGE 6: FULL-HEIGHT BALANCED R.E.F & BARRIER LAYOUT       */
/* ========================================================= */
.p6-flow-wrap {
  position: absolute;
  top: 198px;
  left: 52px;
  width: 689px;
  /* Anchors from 198px down to 1033px, leaving an 87px bottom safety margin */
  height: 835px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

/* Card 1: R.E.F. Analysis (Allocated 58% of card height) */
.p6-card-ref {
  flex: 1.4;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #FFFAE5;
  border: 2px solid #fed7aa;
  border-radius: 26px;
  box-sizing: border-box;
  color: #4a0402;
  font-weight: 700;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}

/* Dynamic Section Heading between the boxes */
.p6-section-title {
  text-align: center;
  font-weight: 900;
  letter-spacing: 1px;
  color: #111111;
  text-transform: uppercase;
  font-family: 'Nunito', sans-serif;
  flex-shrink: 0;
}

/* Card 2: Biggest Barrier & Mindset (Allocated 42% of card height) */
.p6-card-barrier {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #FFFAE5;
  border: 2px solid #fed7aa;
  border-radius: 26px;
  box-sizing: border-box;
  color: #4a0402;
  font-weight: 700;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
}

.p6-closing-note {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1.5px dashed rgba(74, 4, 2, 0.22);
  font-weight: 800;
  color: #7a1010;
}

/* ========================================================= */
/* PAGE 7: AUTO-DISTRIBUTED HEALTH TREE (BOTTOM ANCHORED)   */
/* ========================================================= */
.health-tree-wrap {
  position: absolute;
  top: 140px;
  left: 24px;
  width: 742px;
  /* Fixed vertical span reaching near the bottom (140px + 885px = 1025px) */
  height: 885px;
  display: flex;
  flex-direction: column;
}

.health-row {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1; /* Automatically sets equal vertical spacing across all boxes */
}

/* Seamless Continuous Trunk Line */
.health-row::before {
  content: "";
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2.5px;
  background: #1e1e1e;
}

/* Line starts at Row 1 branch and terminates at Row 4 branch */
.health-row:first-child::before {
  top: 50%;
}
.health-row:last-child::before {
  bottom: 50%;
}

/* Horizontal Prong Connecting Trunk to Card */
.health-branch {
  width: 28px;
  height: 2.5px;
  background: #1e1e1e;
  margin-left: 10px;
  flex-shrink: 0;
}

/* Bigger, Bolder Dynamic Box */
.health-box {
  flex: 1;
  background: #FFFAE5;
  border: 2px solid #1e1e1e;
  border-radius: 28px;
  padding: 18px 26px;
  box-sizing: border-box;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.48;
  color: #4a0402;
}

/* ========================================================= */
/* PAGE 8: DYNAMIC EXECUTION PLAN (SERIAL NUMBERS + TEXT)   */
/* ========================================================= */
.exec-list {
  position: absolute;
  top: 220px;
  left: 80px;
  width: 635px;
  height: 825px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.exec-row {
  display: flex;
  align-items: flex-start;
  gap: 22px;
}

.exec-num {
  font-size: 26px;
  font-weight: 900;
  color: #111111;
  line-height: 1.1;
  min-width: 32px;
  flex-shrink: 0;
  margin-top: 1px;
}

.exec-text {
  font-size: 16.5px;
  font-weight: 700;
  color: #4a0402;
  line-height: 1.44;
  flex: 1;
}

/* PAGE 11: CONCLUSION */
.p11-conc { top: 390px; left: 140px; width: 520px; font-size: 20px; line-height: 1.8; color: #5c1a1a; }

/* MASKING ENGINE */
.black-mask { 
  position: absolute; background: #000; color: #ffd700; font-weight: 900; 
  text-align: center; font-size: 32px; z-index: 20; top: 57px; left: 141px; 
  width: 130px; height: 45px; line-height: 45px; border-radius: 8px;
}

/* PRINTABLES HEADER */
.printable-header { position: absolute; font-size: 15px; font-weight: 700; color: #222; }
.p12-header { top: 108px; left: 60px; }
.p13-header { top: 108px; left: 60px; }
.p14-name { top: 151px; left: 90px; font-size: 15px; font-weight: 700; }
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="page">
  <img src="${images.p1}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="dynamic-text p1-name">${studentName}</div>
    <div class="dynamic-text p1-target">JEE ${attemptType}</div>
    <div class="dynamic-text p1-score">${score}</div>
  </div>
</div>

<!-- PAGE 2: DIAGNOSTICS & FOUNDER NOTE -->
<div class="page">
  <img src="${images.p2}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <!-- Clickable overlay on top-right Canva badge -->
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-top-right"></a>
    <div class="dynamic-text p2-score">${score}</div>
    <div class="dynamic-text p2-gap">${readinessGap}</div>
  </div>
</div>

<!-- PAGE 3a: PHYSICS DEEP DIVE -->
<div class="page">
  <img src="${images.p3a}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-subject"></a>
    <div class="subj-content">${buildSubjectPageHTML("physics", data, marksBySubject)}</div>
  </div>
</div>

<!-- PAGE 3b: CHEMISTRY DEEP DIVE -->
<div class="page">
  <img src="${images.p3b}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-subject"></a>
    <div class="subj-content">${buildSubjectPageHTML("chemistry", data, marksBySubject)}</div>
  </div>
</div>

<!-- PAGE 3c: MATHS DEEP DIVE -->
<div class="page">
  <img src="${images.p3c}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-subject"></a>
    <div class="subj-content">${buildSubjectPageHTML("maths", data, marksBySubject)}</div>
  </div>
</div>

<!-- PAGE 6: R.E.F & BARRIER -->
<div class="page">
  <img src="${images.p6}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="p6-flow-wrap">
      
      <!-- 1. Top Card: R.E.F Analysis -->
      <div 
        class="p6-card-ref" 
        style="padding: ${p6Padding}; font-size: ${p6FontSize}; line-height:${p6LineHeight};"
      >
        <div>${refNotes}</div>
        <div class="p6-closing-note" style="font-size: ${p6FontSize};">
          This is a discipline issue, not a knowledge issue, and it's exactly the kind of pattern a mentor spots before you do, because you can't see your own blind spots from inside them.
        </div>
      </div>

      <!-- 2. Section Heading -->
      <div 
        class="p6-section-title" 
        style="margin: ${p6TitleMargin}; font-size:${p6TitleSize};"
      >
        BIGGEST BARRIER & MINDSET
      </div>

      <!-- 3. Bottom Card: Barrier & Mindset -->
      <div 
        class="p6-card-barrier" 
        style="padding: ${p6Padding}; font-size: ${p6FontSize}; line-height:${p6LineHeight};"
      >
        <div>${barrierNotes}</div>
      </div>

    </div>
  </div>
</div>

<!-- PAGE 7: HEALTH, ENERGY & ENVIRONMENT -->
<div class="page">
  <img src="${images.p7}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="health-tree-wrap">
      <div class="health-row">
        <div class="health-branch"></div>
        <div class="health-box">${get("q13", data)?.mentor_note || ""}</div>
      </div>
      <div class="health-row">
        <div class="health-branch"></div>
        <div class="health-box">${get("q14", data)?.mentor_note || ""}</div>
      </div>
      <div class="health-row">
        <div class="health-branch"></div>
        <div class="health-box">${get("q15", data)?.mentor_note || ""}</div>
      </div>
      <div class="health-row">
        <div class="health-branch"></div>
        <div class="health-box">${get("q16", data)?.mentor_note || ""}</div>
      </div>
    </div>
  </div>
</div>

<!-- PAGE 8: EXECUTION PLAN -->
<div class="page">
  <img src="${images.p8}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="exec-list">
      ${executionPoints.map((pt, idx) => `
        <div class="exec-row">
          <div class="exec-num">${idx + 1}.</div>
          <div class="exec-text">${pt}</div>
        </div>
      `).join("")}
    </div>
  </div>
</div>

<!-- PAGE 9: NOTE TO PARENTS -->
<div class="page">
  <img src="${images.p9}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

<!-- PAGE 11: CONCLUSION -->
<div class="page">
  <img src="${images.p11}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="dynamic-text p11-conc">
      <span style="font-size: 22px; font-weight: 900; color: #a40000;">
        ${get("q18", data)?.one_line || "Final Verdict"}
      </span><br><br>
      ${get("q18", data)?.mentor_note || "Focus on your barriers and execute the plan consistently."}
    </div>
  </div>
</div>

<!-- TASK SUBMISSION -->
${images.taskSubmission ? `
<div class="page">
  <img src="${images.taskSubmission}" class="bg-img" onerror="this.style.display='none'"/>
</div>` : ""}

<!-- PRINTABLES -->
<div class="page">
  <img src="${images.p12}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p12-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target:${attemptType}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p13}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p13-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target:${attemptType}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p14}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p14-name">${studentName}</div>
  </div>
</div>

<div class="page">
  <img src="${images.sundayTracker}" class="bg-img" onerror="this.style.display='none'"/>
</div>

<!-- MINDSET SYSTEMS -->
<div class="page">
  <img src="${images.p6b}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

<!-- CHAPTER PREREQUISITES (END OF DOCUMENT) -->
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

<!-- MENTORSHIP PROMO -->
<div class="page">
  <img src="${images.mentorshipPromo}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="promo-btn-link"></a>
  </div>
</div>

</body>
</html>
  `;

  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 45000 });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf;
}

module.exports = generatePDF;