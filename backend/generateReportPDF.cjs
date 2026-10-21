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
// COMBINED 3-COLUMN SUBJECT DEEP-DIVE ENGINE (Page 3)
// Concise (80% core content preserved), Personalized with Name
// =========================================================

const MARKS_ESTIMATE = {
  physics: [94, 55, 28, 76],
  chemistry: [95, 48, 25, 52],
  maths: [92, 48, 18, 38],
};
const SUBJECT_QUESTION_KEY = { physics: "q4", chemistry: "q5", maths: "q6" };
const SUBJECT_LABEL = { physics: "Physics", chemistry: "Chemistry", maths: "Maths" };

// --- SAFE ANSWER INDEX PARSER (Handles 0/1/2/3, "A"/"B", or "Q4_A") ---
function parseAnswerIndex(val) {
  if (typeof val === "number") return Math.min(3, Math.max(0, val));
  if (typeof val === "string") {
    const letter = val.replace(/.*_/, "").trim().toUpperCase();
    const idx = ["A", "B", "C", "D"].indexOf(letter);
    if (idx !== -1) return idx;
    const num = Number(val);
    if (!isNaN(num)) return Math.min(3, Math.max(0, num));
  }
  return 1;
}

function estimateMarks(subject, rawVal) {
  let idx = 1;
  if (typeof rawVal === "number" && !isNaN(rawVal)) {
    idx = rawVal;
  } else if (typeof rawVal === "string") {
    const letter = rawVal.replace(/.*_/, "").trim().toUpperCase();
    const letterIdx = ["A", "B", "C", "D"].indexOf(letter);
    idx = letterIdx !== -1 ? letterIdx : (Number(rawVal) || 1);
  }
  const arr = MARKS_ESTIMATE[subject];
  return arr && arr[idx] !== undefined ? arr[idx] : 45;
}

function estimateMarks(subject, idx) {
  const arr = MARKS_ESTIMATE[subject];
  return arr[idx] !== undefined ? arr[idx] : 45;
}

// ---------------------------------------------------------------------------
// 1. THE MENTOR'S PERSPECTIVE (Direct, Grounded, Human Tone)
// ---------------------------------------------------------------------------
const SUBJECT_EXPERT_ESSENCE = {
  physics: `Physics is not about cramming 300 formulas. Once you understand that almost every tough problem is just <b>Newton's laws or energy conservation</b> in a new setup, the fear disappears and solving becomes natural.`,

  chemistry: `Chemistry gives you the <b>fastest marks in JEE</b>. While Maths and Physics demand long calculations, Chemistry rewards clear memory and basic logic. With steady revision, you can easily bank <b>70+ marks in 40 minutes</b>.`,

  maths: `In JEE, Maths is where ties are settled. NTA checks your <b>Maths score first</b> during rank ties. You don't have to solve the whole paper—just hunt down the <b>10 to 12 doable questions</b> and solve them calmly without silly errors.`,
};

// ---------------------------------------------------------------------------
// 2. REALITY CHECK: WHAT'S HAPPENING IN YOUR MOCKS (Personalized with Name)
// ---------------------------------------------------------------------------
function getSubjectMirrorReading(subject, idx, firstName) {
  const readings = {
    physics: {
      0: `Physics is your comfort subject, <b>${firstName}</b>. But in tests, your pride can hurt you: spending <b>8 minutes wrestling one stubborn question</b> leaves you with no time left for Maths.`,
      1: `You understand concepts easily in class, <b>${firstName}</b>. But the moment a fresh question combines two topics, <b>your pen stops</b>. You know the theory; you just need to practice solving without checking hints.`,
      2: `Be honest with yourself, <b>${firstName}</b>: you aren't bad at Physics. Your <b>Vectors and Kinematics basics</b> were left weak early on. Once you clear those fundamentals, the harder chapters will open up.`,
      3: `You enjoy Physics, <b>${firstName}</b>, so you spend <b>half your study time watching videos</b> on it. It feels productive, but it starves your other subjects of the practice they actually need.`,
    },
    chemistry: {
      0: `You have a good grip on Chemistry right now, <b>${firstName}</b>. Just remember that memory fades fast here. If you stop revising <b>reactions and exceptions</b> every week, marks drop without warning.`,
      1: `You read a chapter today and remember it well, <b>${firstName}</b>, but by next week it slips away. Re-reading your notes gives a false sense of safety. You need <b>active recall on rough paper</b>.`,
      2: `You've labeled Chemistry as boring memorization, <b>${firstName}</b>, so you avoid it. In mocks, you rush through it in 15 minutes and leave easy marks behind that could have lifted your total score.`,
      3: `You only study the part of Chemistry you like, <b>${firstName}</b>, while ignoring the branch that troubles you. Leaving one-third of the syllabus untouched will keep costing you 20+ easy marks in every mock.`,
    },
    maths: {
      0: `You have strong problem-solving skills, <b>${firstName}</b>. But don't take hard questions personally in the exam hall. Spending 10 minutes on one tricky integral means missing <b>two easy questions</b> later.`,
      1: `You only attempt safe chapters like Vectors and 3D Geometry, <b>${firstName}</b>. The moment you see Calculus or P&C, you hesitate. Don't skip them entirely; many questions only test simple formulas.`,
      2: `Maths creates immediate stress for you, <b>${firstName}</b>. You attempt very few questions and hope other subjects will save you. But building up just <b>30 solid marks</b> here will raise your rank significantly.`,
      3: `Your concepts are good, <b>${firstName}</b>, but you lose marks on <b>sign mistakes and hasty calculations</b>. You walk out thinking you scored 50, but negative marking pulls you down to 30.`,
    },
  };

  return (readings[subject] && readings[subject][idx]) || readings[subject][1];
}

// ---------------------------------------------------------------------------
// 3. ACTION PLAN & ONE PIECE OF ADVICE (Clean, Actionable Steps)
// ---------------------------------------------------------------------------
const SUBJECT_TACTICAL_REMEDIES = {
  physics: {
    0: {
      action: "Set a strict <b>3-minute rule</b> per question in mocks. If an approach stalls, mark it and move ahead. Protect your time for Maths.",
      lesson: "Top scores are lost to stubbornness and fatigue in the last hour, not a lack of theory.",
    },
    1: {
      action: "Pause one-shot videos. Pick your weakest chapter and solve <b>15 PYQs every day</b> with a timer. Try for 4 minutes before checking any solution.",
      lesson: "Solving ability develops on rough paper when you struggle, not by watching someone else solve on a screen.",
    },
    2: {
      action: "Take 10 days to rebuild your foundation: master <b>Vectors, Basic Calculus, and Kinematics</b> first. Then move to formula-heavy chapters like Modern Physics.",
      lesson: "You don't lack aptitude for Physics; you are just missing the basic math it is built on. Fix that first.",
    },
    3: {
      action: "Cap your Physics study to <b>45 minutes of revision</b> every alternate day. Shift that saved hour directly into your weakest subject.",
      lesson: "A balanced 60-60-60 score delivers a much higher percentile than an unbalanced 85-30-30.",
    },
  },
  chemistry: {
    0: {
      action: "Spend <b>15 minutes every morning</b> writing down formulas, named reactions, and inorganic exceptions from memory onto a blank sheet.",
      lesson: "Chemistry marks decay quietly. Treat quick daily recall like a routine habit, not an exam-week task.",
    },
    1: {
      action: "Use the <b>Day 1, Day 3, Day 7 recall rule</b>. When you complete a chapter, write out key reactions from memory without opening your notes.",
      lesson: "Re-reading notes feels easy; testing your memory on blank paper is what actually holds up in tests.",
    },
    2: {
      action: "Start with 3 high-yield chapters: <b>Chemical Bonding, Periodic Table, and Mole Concept</b>. These build the base for most of the subject.",
      lesson: "You don't need to love Chemistry; you just need one 25-mark win in easy chapters to build your confidence.",
    },
    3: {
      action: "Give 45 minutes daily to your weakest branch. For Organic, focus on understanding reaction logic rather than memorizing individual lines.",
      lesson: "Stop spending all your time on the parts you already like. Your fastest mark jump is in the branch you avoid.",
    },
  },
  maths: {
    0: {
      action: "Always scan the paper in Round 1 and lock in the <b>8 to 10 easiest questions</b> first. Never let a single question trap you for over 3 minutes.",
      lesson: "JEE gives the exact same +4 marks for a 1-minute question as an 8-minute marathon. Choose wisely.",
    },
    1: {
      action: "Add 2 predictable chapters to your list this month: <b>Matrices & Determinants and Statistics</b>. They reward direct method practice over clever tricks.",
      lesson: "Staying only in your comfort zone caps your score. Progress comes from picking up one new chapter at a time.",
    },
    2: {
      action: "Focus on 4 formula-based topics: <b>Quadratic Equations, Statistics, Vectors, and Matrices</b>. Aim for a clean 30–35 marks first.",
      lesson: "In JEE Maths, getting 35 clean marks puts you ahead of 75% of candidates. Secure your base first.",
    },
    3: {
      action: "Slow down your rough work by 10%. Write steps clearly in <b>neat vertical columns</b> and double-check signs before marking the bubble.",
      lesson: "You don't need to learn new math to jump 15 marks; you just need to stop giving marks away to careless slips.",
    },
  },
};

// ---------------------------------------------------------------------------
// COMPACT COLUMN GAUGE ("Where You Stand" top bar for each subject)
// ---------------------------------------------------------------------------
function buildCompactColumnGauge(marks, subjectLabel) {
  const pct = Math.max(8, Math.min(92, marks));
  const avgPct = 45;
  const topPct = 88;

  return `
    <div style="margin-bottom: 2px; padding: 0 2px;">
      <div style="text-align: center; font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 18px;">
        Where You Stand: ${subjectLabel}
      </div>
      
      <div style="position: relative; margin-bottom: 4px;">
        <!-- Gradient Bar -->
        <div style="height: 8px; border-radius: 4px; background: linear-gradient(90deg, #3b82f6 0%, #06b6d4 28%, #eab308 58%, #f97316 80%, #ef4444 100%); position: relative;">
          <div style="position: absolute; left: ${avgPct}%; top: -3px; bottom: -3px; width: 1.5px; background: #1e293b; z-index: 2;"></div>
          <div style="position: absolute; left: ${topPct}%; top: -3px; bottom: -3px; width: 1.5px; background: #1e293b; z-index: 2;"></div>
        </div>

        <!-- Floating "You" Pin -->
        <div style="position: absolute; top: -18px; left: ${pct}%; transform: translateX(-50%); z-index: 5; display: flex; flex-direction: column; align-items: center;">
          <div style="background: #c62828; color: #fff; font-size: 8.5px; font-weight: 900; padding: 1px 5px; border-radius: 3px; line-height: 1.2;">
            You
          </div>
          <div style="width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-top: 4px solid #c62828;"></div>
        </div>

        <!-- Labels -->
        <div style="position: relative; height: 20px; margin-top: 3px; font-size: 8.5px; font-weight: 700; line-height: 1.05;">
          <span style="position: absolute; left: 0; color: #475569;">Baseline</span>
          <span style="position: absolute; left: ${avgPct}%; transform: translateX(-50%); color: #1e293b; white-space: nowrap;">Typical Aspirant</span>
          <span style="position: absolute; right: 0; text-align: right; color: #b45309;">Top 1%<br/>IITians</span>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 4. CLEAN 3-COLUMN BUILDER (NO DOTTED BOXES, EQUAL HEIGHT CARDS)
// ---------------------------------------------------------------------------
function buildCombinedSubjectsPageHTML(data, marksBySubject) {
  const rawName = (data?.name || data?.studentName || "Aspirant").trim();
  const firstName = rawName.split(/\s+/)[0] || "Aspirant";

  const subjects = ["physics", "chemistry", "maths"];
  const parsedIdx = {};

  subjects.forEach((subj) => {
    const qKey = SUBJECT_QUESTION_KEY[subj];
    const rawAns = data?.answers?.[qKey];
    let idx = 1;
    if (typeof rawAns === "number") {
      idx = Math.min(3, Math.max(0, rawAns));
    } else if (typeof rawAns === "string") {
      const letter = rawAns.replace(/.*_/, "").toUpperCase();
      const letterIdx = ["A", "B", "C", "D"].indexOf(letter);
      idx = letterIdx !== -1 ? letterIdx : Math.min(3, Math.max(0, Number(rawAns) || 1));
    }
    parsedIdx[subj] = idx;
  });

  const iconCap = `<svg width="13" height="13" viewBox="0 0 24 24" fill="#1d4ed8" style="flex-shrink:0;"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13.5l-7-3.8v4.3L12 21l7-4v-4.3l-7 3.8z"/></svg>`;
  const iconSearch = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2.6" stroke-linecap="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/></svg>`;
  const iconTarget = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" stroke-width="2.4" style="flex-shrink:0;"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="#b91c1c"/></svg>`;

  const columnsHTML = subjects
    .map((subj) => {
      const idx = parsedIdx[subj];
      const marks = MARKS_ESTIMATE[subj]?.[idx] ?? 45;
      const expertText = SUBJECT_EXPERT_ESSENCE[subj];
      const mirrorText = getSubjectMirrorReading(subj, idx, firstName);
      const remedyObj = SUBJECT_TACTICAL_REMEDIES[subj][idx] || SUBJECT_TACTICAL_REMEDIES[subj][1];

      return `
        <div class="subj-col subj-col-${subj}">
          <div>
            ${buildCompactColumnGauge(marks, SUBJECT_LABEL[subj])}
          </div>

          <!-- Box 1: Mentor's Perspective -->
          <div class="s-card s-card-expert">
            <div class="s-card-head">
              ${iconCap}
              <span class="s-pill s-pill-expert">MENTOR PERSPECTIVE</span>
            </div>
            <div class="s-card-body">${expertText}</div>
          </div>

          <!-- Box 2: Your Mock Reality (With Student Name) -->
          <div class="s-card s-card-mirror">
            <div class="s-card-head">
              ${iconSearch}
              <span class="s-pill s-pill-mirror">YOUR MOCK REALITY</span>
            </div>
            <div class="s-card-body">${mirrorText}</div>
          </div>

          <!-- Box 3: Strategic Action Step (No extra dotted boxes) -->
          <div class="s-card s-card-remedy">
            <div class="s-card-head">
              ${iconTarget}
              <span class="s-pill s-pill-remedy">YOUR ACTION STEP</span>
            </div>
            <div class="s-card-body">${remedyObj.action}</div>
          </div>
        </div>
      `;
    })
    .join("");

  const appleSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="1.8"><path d="M12 7c-3 0-6 2-6 6 0 4 3 8 6 8s6-4 6-8c0-4-3-6-6-6z"/><path d="M12 7c0-2 1.5-3.5 3-3.5M8 2v3M12 1v3M16 2v3"/></svg>`;
  const chemSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="1.8"><polygon points="12 4 19 8 19 16 12 20 5 16 5 8 12 4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="19" y1="8" x2="22" y2="6"/></svg>`;
  const mathSvg = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2"><path d="M3 12h18M6 6v12"/><path d="M6 12c2.5-7 5-7 7.5 0s5 7 7.5 0"/></svg>`;

  const physAdvice = (SUBJECT_TACTICAL_REMEDIES.physics[parsedIdx.physics] || SUBJECT_TACTICAL_REMEDIES.physics[1]).lesson;
  const chemAdvice = (SUBJECT_TACTICAL_REMEDIES.chemistry[parsedIdx.chemistry] || SUBJECT_TACTICAL_REMEDIES.chemistry[1]).lesson;
  const mathAdvice = (SUBJECT_TACTICAL_REMEDIES.maths[parsedIdx.maths] || SUBJECT_TACTICAL_REMEDIES.maths[1]).lesson;

  return `
    <div class="subj-combined-subtitle">
      Your subject-wise performance diagnosis & action plan
    </div>

    <!-- 3-Column Subject Matrix -->
    <div class="subj-three-col-grid">
      ${columnsHTML}
    </div>

    <!-- Bottom Full-Width "ONE PIECE OF ADVICE" Section -->
    <div class="subj-bottom-advice-wrap">
      <div class="advice-header-row">
        <div class="advice-navy-pill">
          <span>💡</span>
          <span>ONE PIECE OF ADVICE</span>
        </div>
        <div class="advice-header-line" style="margin-left: 12px;"></div>
      </div>

      <div class="advice-three-cols">
        <!-- Physics Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #dbeafe;">${appleSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #1d4ed8;">PHYSICS</div>
            <div class="advice-subj-text">${physAdvice}</div>
          </div>
        </div>

        <!-- Chemistry Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #fef3c7;">${chemSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #d97706;">CHEMISTRY</div>
            <div class="advice-subj-text">${chemAdvice}</div>
          </div>
        </div>

        <!-- Maths Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #fee2e2;">${mathSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #dc2626;">MATHS</div>
            <div class="advice-subj-text">${mathAdvice}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// CROSS-SUBJECT BALANCE BOX FOR CHEMISTRY & MATHS COLUMNS
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// SINGLE COMBINED PAGE BUILDER (ALL 3 COLUMNS + BOTTOM ONE PIECE OF ADVICE)
// ---------------------------------------------------------------------------
function buildCombinedSubjectsPageHTML(data, marksBySubject) {
  const rawName = (data?.name || data?.studentName || "Aspirant").trim();
  const firstName = rawName.split(/\s+/)[0] || "Aspirant";

  const subjects = ["physics", "chemistry", "maths"];
  const parsedIdx = {};

  subjects.forEach((subj) => {
    const qKey = SUBJECT_QUESTION_KEY[subj];
    const rawAns = data?.answers?.[qKey];
    let idx = 1;
    if (typeof rawAns === "number") {
      idx = Math.min(3, Math.max(0, rawAns));
    } else if (typeof rawAns === "string") {
      const letter = rawAns.replace(/.*_/, "").toUpperCase();
      const letterIdx = ["A", "B", "C", "D"].indexOf(letter);
      idx = letterIdx !== -1 ? letterIdx : Math.min(3, Math.max(0, Number(rawAns) || 1));
    }
    parsedIdx[subj] = idx;
  });

  // Inline SVG Icons for Card Headers
  const iconCap = `<svg width="14" height="14" viewBox="0 0 24 24" fill="#1e3a8a" style="flex-shrink:0;"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 13.5l-7-3.8v4.3L12 21l7-4v-4.3l-7 3.8z"/></svg>`;
  const iconSearch = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.8" stroke-linecap="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.2" y2="16.2"/></svg>`;
  const iconTarget = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.4" style="flex-shrink:0;"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="#dc2626"/></svg>`;

  // Build the 3 vertical columns
  const columnsHTML = subjects
    .map((subj) => {
      const idx = parsedIdx[subj];
      const marks = marksBySubject?.[subj] !== undefined ? marksBySubject[subj] : 45;
      const expertText = SUBJECT_EXPERT_ESSENCE[subj];
      const mirrorText = getSubjectMirrorReading(subj, idx, firstName);
      const remedyObj = SUBJECT_TACTICAL_REMEDIES[subj][idx] || SUBJECT_TACTICAL_REMEDIES[subj][1];

      return `
        <div class="subj-col subj-col-${subj}">
          ${buildCompactColumnGauge(marks, SUBJECT_LABEL[subj])}

          <!-- Box 1: Master's Perspective -->
          <div class="s-card s-card-expert">
            <div class="s-card-head">
              ${iconCap}
              <span class="s-pill s-pill-expert">THE MASTER'S PERSPECTIVE & TACTICAL EDGE</span>
            </div>
            <div class="s-card-body">${expertText}</div>
          </div>

          <!-- Box 2: Diagnostic Mirror (With Student Name) -->
          <div class="s-card s-card-mirror">
            <div class="s-card-head">
              ${iconSearch}
              <span class="s-pill s-pill-mirror">YOUR EXAM REALITY</span>
            </div>
            <div class="s-card-body">${mirrorText}</div>
          </div>

          <!-- Box 3: Strategic Prescription -->
          <div class="s-card s-card-remedy">
            <div class="s-card-head">
              ${iconTarget}
              <span class="s-pill s-pill-remedy">THE STRATEGIC PRESCRIPTION</span>
            </div>
            <div class="s-card-body">${remedyObj.action}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Subject Icons for Bottom "ONE PIECE OF ADVICE" Bar
  const appleSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="1.8"><path d="M12 7c-3 0-6 2-6 6 0 4 3 8 6 8s6-4 6-8c0-4-3-6-6-6z"/><path d="M12 7c0-2 1.5-3.5 3-3.5M8 2v3M12 1v3M16 2v3"/></svg>`;
  const chemSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="1.8"><polygon points="12 4 19 8 19 16 12 20 5 16 5 8 12 4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="19" y1="8" x2="22" y2="6"/></svg>`;
  const mathSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2"><path d="M3 12h18M6 6v12"/><path d="M6 12c2.5-7 5-7 7.5 0s5 7 7.5 0"/></svg>`;

  const physAdvice = (SUBJECT_TACTICAL_REMEDIES.physics[parsedIdx.physics] || SUBJECT_TACTICAL_REMEDIES.physics[1]).lesson;
  const chemAdvice = (SUBJECT_TACTICAL_REMEDIES.chemistry[parsedIdx.chemistry] || SUBJECT_TACTICAL_REMEDIES.chemistry[1]).lesson;
  const mathAdvice = (SUBJECT_TACTICAL_REMEDIES.maths[parsedIdx.maths] || SUBJECT_TACTICAL_REMEDIES.maths[1]).lesson;

  return `
    <div class="subj-combined-subtitle">
      Your subject-wise performance diagnosis & action plan
    </div>

    <!-- 3-Column Subject Matrix -->
    <div class="subj-three-col-grid">
      ${columnsHTML}
    </div>

    <!-- Bottom Full-Width "ONE PIECE OF ADVICE" Section -->
    <div class="subj-bottom-advice-wrap">
      <div class="advice-header-row">
        <div class="advice-navy-pill">
          <span>💡</span>
          <span>ONE PIECE OF ADVICE</span>
        </div>
        <div class="advice-header-line" style="margin-left: 12px;"></div>
      </div>

      <div class="advice-three-cols">
        <!-- Physics Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #dbeafe;">${appleSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #1d4ed8;">PHYSICS</div>
            <div class="advice-subj-text">${physAdvice}</div>
          </div>
        </div>

        <!-- Chemistry Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #fef3c7;">${chemSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #d97706;">CHEMISTRY</div>
            <div class="advice-subj-text">${chemAdvice}</div>
          </div>
        </div>

        <!-- Maths Advice -->
        <div class="advice-col-item">
          <div class="advice-icon-circle" style="background: #fee2e2;">${mathSvg}</div>
          <div>
            <div class="advice-subj-title" style="color: #dc2626;">MATHS</div>
            <div class="advice-subj-text">${mathAdvice}</div>
          </div>
        </div>
      </div>
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
    physics: estimateMarks("physics", data.answers?.q4 ?? data.manifestKeys?.q4),
    chemistry: estimateMarks("chemistry", data.answers?.q5 ?? data.manifestKeys?.q5),
    maths: estimateMarks("maths", data.answers?.q6 ?? data.manifestKeys?.q6),
  };

  function getAsset(name) {
    return imgToBase64(path.resolve(__dirname, `assets/${name}`));
  }

  const images = {
    p1: getAsset("page1_cover.png"),
    p2: getAsset("page2_diagnostics.png"),
    p3_combined: getAsset("subject_deep_dive.png"),
    p6: getAsset("page6_ref.png"),
    p6b: getAsset("page6b_mindset_systems.png"),
    p8: getAsset("page8_exec.png"),
    p9: getAsset("page9_parents.png"),
    p12: getAsset("page12_habit.png"),
    p13: getAsset("page13_mock.png"),
    p14: getAsset("page14_mock_analysis_guide.png"),
    pcm_prerequisites: getAsset(`pcm_${attemptType}.png`) || getAsset(`pcm_prerequisites_${attemptType}.png`),
    mentorshipPromo: getAsset("mentorship_promo.png"),
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
  
// --- PAGE 6 DYNAMIC TEXT & STRUCTURED R.E.F HEADINGS ENGINE ---
  const q7Note = (typeof joinMentorNotes === "function" ? joinMentorNotes(["q7"], data) : "") || get("q7", data)?.mentor_note || "";
  const q8Note = (typeof joinMentorNotes === "function" ? joinMentorNotes(["q8"], data) : "") || get("q8", data)?.mentor_note || "";
  const q10Note = (typeof joinMentorNotes === "function" ? joinMentorNotes(["q10"], data) : "") || get("q10", data)?.mentor_note || "";
  const barrierNotes = get("q11", data)?.mentor_note || "Focus on eliminating your core barrier with dedicated daily practice.";

  // Build structured blocks with clean heading badges
  const refBlocks = [];
  if (q7Note) {
    refBlocks.push(`
      <div style="margin-bottom: 12px;">
        <div style="display: inline-block; font-size: 11px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: #7a1010; background: rgba(122, 16, 16, 0.08); border: 1px solid rgba(122, 16, 16, 0.22); padding: 2px 8px; border-radius: 5px; margin-bottom: 5px;">
          RECALL & RETENTION
        </div>
        <div>${q7Note}</div>
      </div>
    `);
  }
  if (q8Note) {
    refBlocks.push(`
      <div style="margin-bottom: 12px;">
        <div style="display: inline-block; font-size: 11px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: #7a1010; background: rgba(122, 16, 16, 0.08); border: 1px solid rgba(122, 16, 16, 0.22); padding: 2px 8px; border-radius: 5px; margin-bottom: 5px;">
          FOCUS & SOLVING SPEED
        </div>
        <div>${q8Note}</div>
      </div>
    `);
  }
  if (q10Note) {
    refBlocks.push(`
      <div>
        <div style="display: inline-block; font-size: 11px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; color: #7a1010; background: rgba(122, 16, 16, 0.08); border: 1px solid rgba(122, 16, 16, 0.22); padding: 2px 8px; border-radius: 5px; margin-bottom: 5px;">
          ERROR CONTROL & EXAM TRAPS
        </div>
        <div>${q10Note}</div>
      </div>
    `);
  }

  // Define BOTH variables so neither template call can fail
  const refNotes = refBlocks.join("");
  const refBlocksHTML = refNotes;

  // Calculate raw character length (excluding HTML tags) to keep font scaling accurate
  const totalP6Length = (q7Note + q8Note + q10Note + barrierNotes).length;

  // Base tier: Large, bold, commanding font adjusted for heading badges
  let p6FontSize = "17px";
  let p6LineHeight = "1.52";
  let p6Padding = "20px 26px";
  let p6TitleMargin = "16px 0 12px";
  let p6TitleSize = "24px";

  // Graceful scaling steps if multi-selection makes the text longer
  if (totalP6Length > 2200) {
    p6FontSize = "13px";
    p6LineHeight = "1.36";
    p6Padding = "14px 20px";
    p6TitleMargin = "10px 0 8px";
    p6TitleSize = "20px";
  } else if (totalP6Length > 1650) {
    p6FontSize = "14.5px";
    p6LineHeight = "1.42";
    p6Padding = "16px 22px";
    p6TitleMargin = "12px 0 10px";
    p6TitleSize = "21.5px";
  } else if (totalP6Length > 1150) {
    p6FontSize = "15.8px";
    p6LineHeight = "1.46";
    p6Padding = "18px 24px";
    p6TitleMargin = "14px 0 11px";
    p6TitleSize = "23px";
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
/* COMBINED PAGE 3: 3-COLUMN SUBJECT DEEP DIVE (BALANCED)    */
/* ========================================================= */
/* Subtitle shifted lower to cover the gap */
.subj-combined-subtitle {
  position: absolute;
  top: 145px; /* Moved down from 112px */
  left: 0;
  width: 794px;
  text-align: center;
  font-size: 14.5px;
  font-weight: 800;
  color: #334155;
  letter-spacing: -0.1px;
  z-index: 4;
}

/* 3-Column Grid */
.subj-three-col-grid {
  position: absolute;
  top: 195px; /* Starts cleanly below subtitle */
  left: 14px;
  width: 766px;
  height: 720px; /* Locked height fills the outline down to advice bar */
  display: grid;
  grid-template-columns: repeat(3, 249px);
  justify-content: space-between;
  z-index: 3;
  box-sizing: border-box;
}

/* Fully closed boxes with complete 4-sided borders */
.subj-col {
  background: #ffffff;
  padding: 10px 10px 14px 10px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  border-radius: 16px; /* Fully rounded corners on all 4 sides */
}

/* 4-sided closed borders */
.subj-col-physics {
  border: 1.5px solid #93c5fd;
}
.subj-col-chemistry {
  border: 1.5px solid #fde047;
}
.subj-col-maths {
  border: 1.5px solid #fda4af;
}

.subj-col-physics {
  border-left: 1.5px solid #93c5fd;
  border-right: 1.5px solid #93c5fd;
  border-bottom: 1.5px solid #93c5fd;
}
.subj-col-chemistry {
  border-left: 1.5px solid #fde047;
  border-right: 1.5px solid #fde047;
  border-bottom: 1.5px solid #fde047;
}
.subj-col-maths {
  border-left: 1.5px solid #fda4af;
  border-right: 1.5px solid #fda4af;
  border-bottom: 1.5px solid #fda4af;
}

/* Individual Card Styling with Comfortable Breathing Room */
.s-card {
  border-radius: 14px;
  padding: 13px 13px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1; /* All 3 cards share height proportionally */
  margin-top: 8px;
  justify-content: flex-start;
}

.s-card-expert {
  background: #ffffff;
  border: 1.5px solid #bfdbfe;
}

.s-card-mirror {
  background: #fffdf5;
  border: 1.5px solid #fde68a;
}

.s-card-remedy {
  background: #fffafa;
  border: 1.5px solid #fecaca;
}

/* Card Header Row */
.s-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Anti-Overflow Badges: wrapped & sized so text never spills out */
.s-pill {
  font-size: 8.2px;
  font-weight: 800;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  padding: 3px 6px;
  border-radius: 5px;
  line-height: 1.2;
  white-space: normal; /* Prevents overflow clipping */
  max-width: calc(100% - 20px);
  box-sizing: border-box;
}

.s-pill-expert {
  background: #eff6ff;
  color: #1d4ed8;
}
.s-pill-mirror {
  background: #fef3c7;
  color: #b45309;
}
.s-pill-remedy {
  background: #fee2e2;
  color: #b91c1c;
}

/* Natural, comfortable reading font */
.s-card-body {
  font-size: 11.6px;
  line-height: 1.5;
  color: #334155;
  font-weight: 500;
}

.s-card-body b {
  font-weight: 800;
  color: #0f172a;
}

/* Bottom Full-Width "ONE PIECE OF ADVICE" Section */
.subj-bottom-advice-wrap {
  position: absolute;
  top: 922px;
  left: 10px;
  width: 774px;
  height: 132px;
  background: #ffffff;
  padding-top: 6px;
  box-sizing: border-box;
  z-index: 5;
}

.advice-header-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  position: relative;
}

.advice-header-line {
  flex: 1;
  height: 1px;
  background: #cbd5e1;
}

.advice-navy-pill {
  background: #0f172a;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.advice-three-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  padding: 0 6px;
}

.advice-col-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 2px 12px;
  border-right: 1px solid #cbd5e1;
}
.advice-col-item:last-child {
  border-right: none;
}

.advice-icon-circle {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.advice-subj-title {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.3px;
  margin-bottom: 3px;
  text-transform: uppercase;
}

.advice-subj-text {
  font-size: 10.5px;
  line-height: 1.42;
  color: #1e293b;
  font-weight: 600;
}

.pill-link-bottom-center {
  position: absolute;
  top: 1056px;
  left: 322px;
  width: 150px;
  height: 32px;
  z-index: 20;
  display: block;
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

/* R.E.F Sub-Section Badges */
.ref-section-block {
  margin-bottom: 14px;
}
.ref-section-block:last-child {
  margin-bottom: 0;
}
.ref-badge {
  display: inline-block;
  font-size: 11.5px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #7a1010;
  background: rgba(122, 16, 16, 0.08);
  border: 1px solid rgba(122, 16, 16, 0.22);
  padding: 2px 9px;
  border-radius: 6px;
  margin-bottom: 5px;
}
.ref-para-text {
  display: block;
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
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-top-right"></a>
    <div class="dynamic-text p2-score">${score}</div>
    <div class="dynamic-text p2-gap">${readinessGap}</div>
  </div>
</div>

<!-- PAGE 3: COMBINED 3-COLUMN JEE SUBJECT DEEP DIVE -->
<div class="page">
  <img src="${images.p3_combined}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    ${buildCombinedSubjectsPageHTML(data, marksBySubject)}
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-bottom-center"></a>
  </div>
</div>

<!-- PAGE 4: R.E.F & BARRIER -->
<div class="page">
  <img src="${images.p6}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="p6-flow-wrap">
      
      <!-- 1. Top Card: Structured R.E.F Analysis -->
      <div 
        class="p6-card-ref" 
        style="padding: ${p6Padding}; font-size: ${p6FontSize}; line-height:${p6LineHeight};"
      >
        <div>${refBlocksHTML}</div>
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
        <div>
          <div class="ref-badge" style="margin-bottom: 8px;">🛑 CORE BEHAVIORAL BLOCK</div>
          <div>${barrierNotes}</div>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- PAGE 5: EXECUTION PLAN -->
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

<!-- PAGE 6: NOTE TO PARENTS -->
<div class="page">
  <img src="${images.p9}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

<!-- PAGE 7: 90-DAY HABIT GRID -->
<div class="page">
  <img src="${images.p12}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p12-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target:${attemptType}
    </div>
  </div>
</div>

<!-- PAGE 8: MOCK TEST TRACKER -->
<div class="page">
  <img src="${images.p13}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p13-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target:${attemptType}
    </div>
  </div>
</div>

<!-- PAGE 9: MOCK ANALYSIS GUIDE -->
<div class="page">
  <img src="${images.p14}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p14-name">${studentName}</div>
  </div>
</div>

<!-- PAGE 10: PCM PREREQUISITES (Unified Single Page for 2027 or 2028) -->
<div class="page">
  <img src="${images.pcm_prerequisites}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

<!-- PAGE 11: MINDSET SYSTEMS -->
<div class="page">
  <img src="${images.p6b}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

<!-- PAGE 12: MENTORSHIP PROMO (FINAL CLOSING PAGE) -->
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