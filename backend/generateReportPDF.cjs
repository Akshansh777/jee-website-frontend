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
  physics: `Stop trying to remember every single edge-case formula. Real JEE Physics rewards <b>free-body diagrams, energy balance, and clear mechanics basics</b>. Build the core foundation first, and multi-concept questions will naturally start clicking.`,

  chemistry: `Chemistry produces the <b>highest return on investment</b> across the entire exam. A mark here counts the same as a mark in a brutal 8-minute Maths integration. Consistent, quick recall lets you sweep through the section and build early exam momentum.`,

  maths: `JEE Maths is an exam of <b>ruthless question selection</b>. The test is designed with traps to eat your time. Your real job is filtering out the noise, securing the predictable chapters, and protecting yourself against careless arithmetic slips.`,
};

// ---------------------------------------------------------------------------
// 2. THE DIAGNOSTIC MIRROR (100% Aligned to Exact Quiz Options & Persona)
// ---------------------------------------------------------------------------
function getSubjectMirrorReading(subject, idx, firstName) {
  const readings = {
    // Q4. How is your Physics (Honestly)?
    // Option A (0): Strong: I can solve JEE Mains PYQs accurately under timed practice now.
    // Option B (1): Average: I understand concepts but get stuck on tricky questions; I am giving it high priority.
    // Option C (2): Weak: I struggle with basics; I am ignoring them to focus on Chemistry/Math.
    // Option D (3): Comfort Trap: Physics is my strongest subject, yet I still spend 50%+ of my time watching videos on Physics because I like it.
    physics: {
      0: `Physics is genuinely your stronghold, <b>${firstName}</b>. You have the conceptual speed and timed accuracy that most aspirants envy. Your only hidden trap now is over-solving: don't let your confidence turn into a time sink where Physics steals hours that Chemistry or Maths desperately need.`,
      1: `You understand the core theory well, <b>${firstName}</b>, but you freeze when questions twist two topics together. You're giving it high priority, which is great, but watching more video explanations won't fix this. You need to struggle through unassisted PYQs on blank paper to build real solving stamina.`,
      2: `Let's be direct, <b>${firstName}</b>: ignoring Physics to take shelter in Chemistry and Maths is a dangerous gamble. You're struggling because early fundamentals—<b>Vectors, Kinematics, and basic Calculus</b>—were left shaky. Running away from them now guarantees you lose easy cutoff marks on exam day.`,
      3: `You are caught in the classic <b>Comfort Trap</b>, <b>${firstName}</b>. Physics is already your strongest subject, yet you spend half your day watching Physics lectures because solving it gives you a quick dopamine hit. You are over-polishing what already works while your rank-deciding leaks go ignored.`,
    },

    // Q5. How is your Chemistry (Honestly)?
    // Option A (0): Strong: NCERT is on my tips; I score high consistently.
    // Option B (1): Volatile: I memorize it, but forget it in 3 days; I spend time re-reading notes constantly.
    // Option C (2): Weak: I hate Chemistry; I barely touch this subject.
    // Option D (3): Average: I am good at any one part(OC/IOC/PC), and bad at another.
    chemistry: {
      0: `Having NCERT at your fingertips is a rare advantage, <b>${firstName}</b>. You have locked down the highest-scoring section of the exam. Your primary focus now is pure retention maintenance: a quick weekly spaced recall so silent memory decay doesn't cost you easy marks near the exam.`,
      1: `You are stuck in a <b>leaky-bucket memory loop</b>, <b>${firstName}</b>. You memorize reactions, forget them within 72 hours, and waste endless hours passively re-reading notes. Re-reading creates the illusion of learning. Without closed-book active recall, reactions will always look blurry under exam pressure.`,
      2: `Let's confront the reality, <b>${firstName}</b>: avoiding Chemistry because you hate it is the single biggest threat to your JEE rank. Chemistry offers the <b>fastest, lowest-effort marks</b> in the entire paper. Abandoning it forces an unrealistic scoring burden onto Physics and Maths that almost no student survives.`,
      3: `You are running a <b>split preparation</b>, <b>${firstName}</b>. Excelling in one branch (like Physical) while abandoning another (like Organic or Inorganic) means you enter every mock test with one arm tied behind your back. You are throwing away 20+ low-hanging marks in the branch you avoid.`,
    },

    // Q6. How is your Mathematics (Honestly)?
    // Option A (0): Killer: I love Math; I love solving complex problems in a given time.
    // Option B (1): Survivor: I only target specific high-weightage chapters (Vector/3D) to clear cutoff.
    // Option C (2): Phobia: I am terrified of Math; I haven't solved a question in weeks.
    // Option D (3): The Ego Lifter: I am weak, but I waste hours trying to solve impossible problems just to prove I can.
    maths: {
      0: `You have genuine mathematical talent, <b>${firstName}</b>, and solving complex problems under a timer gives you an unfair advantage. Your only priority in mocks is <b>tactical patience</b>: never let an interesting, difficult problem trap you for 10 minutes when easier +4 marks are sitting untouched.`,
      1: `You are in <b>survival mode</b>, <b>${firstName}</b>, sticking strictly to high-yield cutoff chapters like Vectors and 3D. While practical, this puts a hard ceiling on your rank. Many questions in coordinate geometry, matrices, and statistics are direct formula applications that you are skipping purely out of caution.`,
      2: `Let's address the math anxiety head-on, <b>${firstName}</b>: avoiding question-solving for weeks has created a mental wall. But you don't need to conquer the whole syllabus. In JEE Maths, scoring just <b>30 to 35 clean marks</b> puts you ahead of 75% of test-takers nationwide. You need to start small.`,
      3: `You are suffering from <b>The Ego Lifter trap</b>, <b>${firstName}</b>. You know your foundation is shaky, yet you spend hours wrestling with brutal, multi-concept problems just to prove your intellect. JEE doesn't reward bravado—it gives the exact same +4 marks for a 60-second question as a 15-minute marathon. You are burning time feeding your ego instead of building your rank.`,
    },
  };

  return (readings[subject] && readings[subject][idx]) || readings[subject][1];
}

// ---------------------------------------------------------------------------
// 3. THE STRATEGIC PRESCRIPTION (Directly Solves the Option Selected)
// ---------------------------------------------------------------------------
const SUBJECT_TACTICAL_REMEDIES = {
  physics: {
    // Option A (Strong)
    0: {
      action: "Set a strict <b>45-minute daily cap</b> on Physics. Spend that time on timed mock sprints, and redirect the rest of your study block to your weaker subjects.",
      lesson: "When a subject is strong, your job is maintenance and speed, not endless video consumption.",
    },
    // Option B (Average - Tricky Qs)
    1: {
      action: "Stop watching concept lectures. Pick your weakest chapter, set a 4-minute timer per question, and <b>solve 15 PYQs alone on rough paper</b> before checking any hint.",
      lesson: "Real problem-solving intuition only develops when your pen is stuck and you force your brain to find a way out.",
    },
    // Option C (Weak - Avoiding)
    2: {
      action: "Take 10 days for a <b>Foundation Reset</b>: master Vectors, Differentiation, and Kinematics until resolving components is second nature. Don't touch 12th chapters yet.",
      lesson: "You don't lack aptitude for Physics; you are simply missing the mathematical tools it is written in.",
    },
    // Option D (Comfort Trap)
    3: {
      action: "<b>Cut your Physics video time by 60% starting today.</b> Cap Physics to 40 minutes of problem-solving, and transfer the remaining 90 minutes directly to Maths or Chemistry.",
      lesson: "A balanced 65-65-65 score beats a lopsided 90-30-30 percentile every single time. Stop hiding in what feels easy.",
    },
  },

  chemistry: {
    // Option A (Strong)
    0: {
      action: "Do a <b>15-minute morning active recall</b> every 3 days: write key reactions and Inorganic trend exceptions onto a blank sheet from memory to lock in your speed.",
      lesson: "High Chemistry scores drop silently. Treat quick active recall like daily hygiene to keep your edge sharp.",
    },
    // Option B (Volatile - Forgets in 3 days)
    1: {
      action: "Use the <b>Day 1, Day 3, Day 7 Recall Cycle</b>. Close your notes and test yourself on a blank sheet: if you cannot write the reagent from memory, you don't know it.",
      lesson: "Re-reading notes gives a false sense of security; closed-book retrieval is the only thing that holds up under exam pressure.",
    },
    // Option C (Weak - Hates Chem)
    2: {
      action: "Don't try to master the whole subject. Target just 3 high-yield units: <b>Chemical Bonding, Periodic Table, and Mole Concept</b>. These build 60% of the logic you need.",
      lesson: "You don't have to love Chemistry; you just need one 25-mark win in predictable chapters to break the mental block.",
    },
    // Option D (Split Half)
    3: {
      action: "Give the first 45 minutes of every study day strictly to your <b>avoided Chemistry branch</b>. For Organic, master GOC mechanisms; for Inorganic, outline NCERT tables.",
      lesson: "Stop pouring all your energy into the part you already like. Your fastest mark jump is hiding in the branch you avoid.",
    },
  },

  maths: {
    // Option A (Killer)
    0: {
      action: "In mocks, scan the entire paper in Round 1 and lock in the <b>8 to 10 easiest problems</b> first. Enforce a hard 3-minute drop rule on complex questions.",
      lesson: "JEE gives the exact same +4 marks for a 45-second question as an 8-minute marathon. Leave your ego outside the test hall.",
    },
    // Option B (Survivor - Cutoff only)
    1: {
      action: "Add 2 predictable chapters to your list this month: <b>Matrices & Determinants and Statistics</b>. They reward direct method practice over clever mathematical tricks.",
      lesson: "Your safe zone has a hard ceiling. Progress comes from expanding your chapter list one structured topic at a time.",
    },
    // Option C (Phobia - Avoided for weeks)
    2: {
      action: "Start with just <b>10 easy PYQs daily</b> from Quadratic Equations and Vectors. Solve them slowly without timing pressure to rebuild your confidence.",
      lesson: "Scoring just 30 to 35 clean marks in JEE Maths puts you ahead of 75% of aspirants. You don't need genius; you need basic consistency.",
    },
    // Option D (The Ego Lifter)
    3: {
      action: "<b>Ban yourself from attempting tough, Olympiad-level questions for 21 days.</b> Rebuild your base by solving 20 standard JEE Main PYQs daily with clean, step-by-step rough work.",
      lesson: "Stop using hard problems to feed your pride. Clear the low-hanging +4 marks first before chasing questions designed to trip you up.",
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
    // Check both answers and manifestKeys as fallback
    const rawAns = data?.answers?.[qKey] ?? data?.manifestKeys?.[qKey];
    let idx = 1;

    if (typeof rawAns === "number" && !isNaN(rawAns)) {
      idx = Math.min(3, Math.max(0, rawAns));
    } else if (typeof rawAns === "string") {
      // Handles "Q6_D", "q6_d", "D", or "3"
      const cleanStr = rawAns.trim();
      const letter = cleanStr.replace(/.*_/, "").toUpperCase();
      const letterIdx = ["A", "B", "C", "D"].indexOf(letter);
      if (letterIdx !== -1) {
        idx = letterIdx;
      } else {
        const parsedNum = Number(cleanStr);
        idx = !isNaN(parsedNum) ? Math.min(3, Math.max(0, parsedNum)) : 1;
      }
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