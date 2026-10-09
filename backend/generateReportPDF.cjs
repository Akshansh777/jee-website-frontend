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
// 3-Tier Persona Architecture:
// 1. Subject Master (PhD reverence + tactical JEE leverage)
// 2. Diagnostic Mirror (Uncanny pattern diagnosis of exam reality)
// 3. Tactical Remedy (Actionable prescription + One Piece of Advice)
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

// ---------------------------------------------------------------------------
// 1. PERSONA: THE SUBJECT MASTER & JEE STRATEGIST
// Inspires reverence for the discipline and reveals its asymmetric JEE edge
// ---------------------------------------------------------------------------
const SUBJECT_EXPERT_ESSENCE = {
  physics: `Physics is not a chore of memorizing 300 disjointed formulas; it is the mathematical language of physical reality. From the conservation of angular momentum in rotating galaxies to electron drift across semiconductor junctions, the universe runs on just a handful of unbreakable conservation laws. In JEE, Physics is your greatest tactical accelerator: the moment you realize almost every 'hard' problem is merely basic Newton's laws and energy conservation disguised in complex language, anxiety disappears and genuine solving intuition takes over.`,

  chemistry: `Chemistry is the highest-leverage asymmetric asset on the entire JEE paper. While Physics and Maths demand grueling multi-step calculations, Chemistry rewards spatial visualization, thermodynamic logic, and pattern recognition. It is the atomic architecture of matter. More importantly, an average mark in Chemistry takes one-third the time to secure compared to Maths: master your reaction mechanisms and periodic trends, and you will bank 70+ marks in 40 minutes, creating the exact time cushion needed to conquer the rest of the exam.`,

  maths: `Mathematics in JEE is high-intensity intellectual warfare. It is the ultimate crucible of structural thinking, endurance, and analytical grit. NTA places Maths as the primary tie-breaker for an exact reason: when thousands of aspirants land on identical total marks, your Maths score alone decides your rank and branch. Winning in Maths does not require solving the entire paper; it requires possessing the sharp tactical vision to hunt down the 12 to 14 cleanest problems and executing them with ruthless arithmetic precision.`,
};

// ---------------------------------------------------------------------------
// 2. PERSONA: THE DIAGNOSTIC MIRROR ("Astrologer" Persona)
// Hyper-accurate diagnosis of their study habits, cognitive traps, and test-hall reality
// ---------------------------------------------------------------------------
const SUBJECT_MIRROR_READING = {
  physics: {
    0: `You treat Physics as your emotional comfort zone. When a study session feels overwhelming, you naturally open Physics because solving it gives you a quick feeling of productivity. In mocks, you attack Physics first to build confidence, but your ego becomes a silent trap: you will burn 8 to 10 minutes wrestling with an intricate mechanics problem just to prove you can crack it. You believe Physics is carrying your preparation, but in reality, the excessive hours you pour into it are quietly starving your aggregate score.`,
    1: `You understand classroom lectures effortlessly and nod along with every derivation on the board. You leave class convinced the chapter is mastered. But the second a fresh mock question scrambles two concepts—like rolling motion on an inclined plane threaded with a magnetic field—your pen freezes. You stare at the blank margin, second-guessing which formula applies while 5 minutes tick away. You don't have a knowledge gap; you have a translation gap between passive theory and active execution.`,
    2: `You have convinced yourself that you simply lack the "innate brain" for Physics. When you open a test, the wall of variables and boundary conditions triggers immediate avoidance. Here is the unvarnished reality of what is happening: you aren't bad at Physics; your foundation in Vectors, Kinematics, and basic Calculus was left shaky in month one. Trying to solve Electrostatics or Rotational Dynamics without rock-solid vector resolution is like attempting to construct a skyscraper on wet mud.`,
    3: `Your Physics score is an erratic rollercoaster that depends entirely on the question paper's mood. When the paper tests direct formula applications in Modern Physics or Current Electricity, you feel invincible; the moment multi-concept Mechanics or Wave Optics dominates, your score collapses. You cherry-pick the chapters you enjoy and quietly skim the rest, hoping the exam paper will miraculously favor your comfort zones.`,
  },
  chemistry: {
    0: `Chemistry is currently scoring well for you, but you treat it with dangerous complacency. Because the reactions feel intuitive right now, you push revision to the end of the week. What you do not see is the silent, exponential decay of memory: inorganic exception tables, reagent nuances, and physical equilibrium constants vanish without warning unless anchored by structured recall cycles. Your high score is vulnerable to the first tough paper you encounter.`,
    1: `Your relationship with Chemistry is a cycle of rapid learning followed by rapid evaporation. You read a chapter on Tuesday, recall every reaction on Wednesday, and by the following Sunday, four distinct reagents look completely identical. Your mock marks fluctuate wildly between 30 and 65 based purely on how recently you crammed your notes. You mistake the visual comfort of re-reading notes for actual active recall under negative-marking pressure.`,
    2: `You have written Chemistry off as a mindless memorization chore that you refuse to respect. You open Organic Chemistry, see hundreds of named reactions, and shut down. You tell yourself that you will "cram Inorganic in the final two months," carrying a persistent cloud of guilt into every study block. In mock exams, you rush through Chemistry in 20 minutes, leave half the paper blank, and pray that Maths or Physics will somehow bridge the deficit.`,
    3: `You suffer from a severe split personality inside this single subject. You can solve Physical Chemistry numericals comfortably all day while actively avoiding Organic mechanisms—or you understand General Organic Chemistry but completely blank out on Inorganic coordination compounds. You keep grinding the 30% of Chemistry you already like while leaving the remaining 70% completely unarmored.`,
  },
  maths: {
    0: `You possess genuine mathematical talent, but your pride is your greatest liability in an exam hall. When a challenging question appears in Definite Integration or Complex Numbers, you take it as an insult to your intellect. You refuse to move on, spending 12 minutes grinding through brutal algebra to force an answer. You crack the problem, but in doing so, you sacrifice 3 clean, high-yield questions waiting untouched at the back of the paper.`,
    1: `You have constructed an artificial ceiling around your mathematical ability. You stick strictly to your safe comfort zones—Matrices, Determinants, Vectors, and 3D Geometry. The moment a question touches Permutations, Probability, or Calculus, you immediately back away. You enter every mock expecting to score around 40, and that expectation becomes reality because you refuse to attempt the calculated risks needed to reach 65+.`,
    2: `You look at the Maths section with genuine dread. During mocks, you attempt 5 or 6 problems with a racing pulse, make 3 careless arithmetic slips, and walk away with single-digit marks. You have started quietly rationalizing that Physics and Chemistry will compensate for Maths. But under NTA's primary tie-breaking protocol, an abandoned Maths section permanently caps your percentile ceiling and guarantees you lose every single tie.`,
    3: `Your conceptual understanding is solid, but your execution bleeds marks on every page. You conceptualize the solution accurately, write down the right first three steps, and then drop a minus sign or bungle basic quadratic arithmetic at the very end. You walk out believing you scored 60, only to discover negative marking gutted your paper down to 35. You don't have a concept deficit; you have a calculation discipline deficit.`,
  },
};

// ---------------------------------------------------------------------------
// 3. PERSONA: THE MENTOR REMEDY (Tactical Prescriptions & "One Piece of Advice")
// ---------------------------------------------------------------------------
const SUBJECT_TACTICAL_REMEDIES = {
  physics: {
    0: {
      action: "Cap your Physics problem-solving to exactly 45 minutes of mixed PYQ revision every alternate day. Stop seeking comfort in your strongest subject; redirect those saved daily hours into your weakest paper.",
      lesson: "One Piece of Advice: In JEE, having one 85-mark subject and two 35-mark subjects produces a lower percentile than a balanced 65-65-65. Never let your favorite subject cannibalize your preparation.",
    },
    1: {
      action: "Stop watching theory lectures and one-shots. You already know the theory. Pick your weakest 3 chapters and solve 15 unassisted PYQs daily with a stopwatch running. Struggle with the question for 4 minutes before checking any solution.",
      lesson: "One Piece of Advice: Confidence in Physics is built by wrestling with problems in the rough notebook, not by watching someone else solve them on a screen.",
    },
    2: {
      action: "Implement a strict 14-day foundation reset. Do not touch Modern Physics or Magnetism yet. Master Vectors, Differentiation/Integration basics, and Kinematics until resolving components is second nature. Then tackle Units & Dimensions.",
      lesson: "One Piece of Advice: You are not bad at Physics; you are missing the mathematical alphabet it is written in. Fix the foundation and the advanced chapters will unlock naturally.",
    },
    3: {
      action: "Build a High-Yield Master List: Modern Physics, Current Electricity, Semiconductor Devices, and Gravitation. These 4 units alone account for 35-40% of JEE Main Physics marks with minimal conceptual twist.",
      lesson: "One Piece of Advice: Standardize your baseline first. You do not need 100% syllabus mastery to score 70+; you need 100% command over the predictable 50%.",
    },
  },
  chemistry: {
    0: {
      action: "Implement a daily 20-minute morning active-recall ritual. Review Inorganic trend charts and Organic reaction roadmaps on a fixed Day 1, Day 3, Day 7 schedule. Maintain your speed so Chemistry continues buying you time for Maths.",
      lesson: "One Piece of Advice: High Chemistry scorers lose marks through silent memory decay. Treat recall as a daily maintenance habit, not an exam-week sprint.",
    },
    1: {
      action: "Institute the strict 1-3-7 Spaced Retrieval Rule: whenever you finish an Organic or Inorganic chapter, test yourself on blank paper on Day 1, Day 3, and Day 7. Write out reagents from memory without glancing at your notes.",
      lesson: "One Piece of Advice: Re-reading your notes creates the illusion of learning. Forcing your brain to retrieve a reaction from a blank page is what permanently locks it into long-term memory.",
    },
    2: {
      action: "Do not attempt the entire syllabus. Target Chemical Bonding, Coordination Compounds, and Periodic Table first. These three chapters unlock the conceptual logic for 60% of all Inorganic and Organic chemistry questions.",
      lesson: "One Piece of Advice: You do not need to fall in love with Chemistry. You need one fast, reliable 25-mark win in a high-yield chapter to prove to yourself that this subject is conquerable.",
    },
    3: {
      action: "Reframe Organic Chemistry from memory into logic: group all reactions into 6 core mechanistic families rather than 200 individual reactions. For Physical Chemistry, drill 20 formula-application questions under a 90-second timer.",
      lesson: "One Piece of Advice: Stop treating Chemistry as one uniform subject. Attack your strong half for speed, and restructure your weak half through first-principles logic.",
    },
  },
  maths: {
    0: {
      action: "Enforce the 3-Minute Hard Ceiling during practice: if an approach does not show clear progress within 180 seconds, flag the question and drop it immediately. Train yourself to hunt for shortest methods and alternate substitutions.",
      lesson: "One Piece of Advice: JEE awards the exact same +4 marks for a 45-second Statistics question as it does for an 8-minute Definite Integration marathon. Leave your ego outside the exam hall.",
    },
    1: {
      action: "Break your mathematical ceiling by mastering 2 new chapters this fortnight: Vector-3D and Straight Lines. These chapters reward formula memorization and structured steps rather than non-routine creative flashes.",
      lesson: "One Piece of Advice: Your ceiling exists because you only attempt questions you already know how to solve. Progress begins the moment you sit with an unfamiliar topic and work through the discomfort.",
    },
    2: {
      action: "Abandon full-syllabus ambitions immediately. Focus 100% of your energy on mastering 4 formula-centric chapters: Quadratic Equations, Sets & Relations, Statistics, and Mathematical Reasoning/Vectors. That guarantees 25-35 marks with zero genius required.",
      lesson: "One Piece of Advice: In JEE Maths, scoring 35 marks puts you ahead of 75% of all test-takers nationwide. Do not aim for 80; lock down 35 clean, unshakeable marks first.",
    },
    3: {
      action: "Slow down your rough work by 10%. Divide your rough sheet into clean, numbered vertical columns. Write every calculation step legibly. Calculate twice before bubbling the final answer to eliminate the -1 mark unforced error drain.",
      lesson: "One Piece of Advice: You do not need to learn more advanced mathematics to jump 20 marks; you simply need to stop donating marks to careless arithmetic slips.",
    },
  },
};

// ---------------------------------------------------------------------------
// DYNAMIC CROSS-SUBJECT BALANCE & COMPENSATION ENGINE
// ---------------------------------------------------------------------------
function getCrossSubjectDirective(subject, marksBySubject) {
  const currentMarks = marksBySubject[subject] || 35;
  const otherKeys = Object.keys(marksBySubject).filter((k) => k !== subject);
  const otherAvg = otherKeys.reduce((sum, k) => sum + (marksBySubject[k] || 35), 0) / otherKeys.length;
  const gap = currentMarks - otherAvg;

  if (gap >= 18) {
    const weakerSubject = otherKeys.reduce((a, b) => (marksBySubject[a] < marksBySubject[b] ? a : b));
    return `⚠️ Strategic Balance Warning: Your ${SUBJECT_LABEL[subject]} is outperforming your ${SUBJECT_LABEL[weakerSubject]} by ~${Math.round(gap)} marks. Capping practice hours here and transferring 60 daily minutes to ${SUBJECT_LABEL[weakerSubject]} will increase your aggregate JEE percentile far faster.`;
  } else if (gap <= -18) {
    const strongerSubject = otherKeys.reduce((a, b) => (marksBySubject[a] > marksBySubject[b] ? a : b));
    return `🎯 Score Multiplier Opportunity: Your ${SUBJECT_LABEL[subject]} is lagging ~${Math.round(Math.abs(gap))} marks behind your ${SUBJECT_LABEL[strongerSubject]}. Raising this floor to a safe baseline is your fastest route to a 99+ percentile jump, as each additional mark here requires far less effort than squeezing extra marks out of your top subject.`;
  } else {
    return `⚖️ Tri-Subject Synergy: Your performance across Physics, Chemistry, and Maths is relatively balanced. Maintain this equilibrium: avoid spending more than 40% of your daily solving time on any single subject, and preserve your Chemistry speed to protect your Maths endurance.`;
  }
}

// ---------------------------------------------------------------------------
// COMBINED "WHERE YOU STAND" + "PEER REFERENCE" GAUGE
// ---------------------------------------------------------------------------
function buildCombinedStandGauge(marks, subjectLabel) {
  const pct = Math.max(6, Math.min(94, marks));
  const avgPct = 45;
  const topPct = 90;

  return `
    <div style="margin-bottom: 8px;">
      <div style="font-size: 16px; font-weight: 800; color: #111; margin-bottom: 8px; letter-spacing: -0.2px;">
        Where You Stand: ${subjectLabel}
      </div>
      
      <div style="position: relative; margin-top: 24px; margin-bottom: 10px;">
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

        <div style="position: relative; height: 16px; margin-top: 5px; font-size: 11.5px; font-weight: 700;">
          <span style="position: absolute; left: 0; color: #94a3b8;">Baseline</span>
          <span style="position: absolute; left: ${avgPct}%; transform: translateX(-50%); color: #475569;">Typical Aspirant</span>
          <span style="position: absolute; left: ${topPct}%; transform: translateX(-50%); color: #b45309;">Top 1% IITians</span>
        </div>
      </div>
    </div>
  `;
}

// --- CROSS-SUBJECT SCORE IMBALANCE DETECTOR ---
function detectCompensation(subject, marksBySubject = {}) {
  const others = Object.keys(marksBySubject).filter((k) => k !== subject);
  if (others.length === 0) return null;

  const currentMarks = marksBySubject[subject] !== undefined ? marksBySubject[subject] : 35;
  const otherAvg = others.reduce((sum, k) => sum + (marksBySubject[k] || 35), 0) / others.length;
  const gap = otherAvg - currentMarks;

  if (gap < 20) return null;

  const strongerSubject = others.reduce((a, b) => 
    ((marksBySubject[a] || 0) > (marksBySubject[b] || 0) ? a : b)
  );

  return {
    gap: Math.round(gap),
    strongerLabel: SUBJECT_LABEL[strongerSubject] || strongerSubject,
    weakerLabel: SUBJECT_LABEL[subject] || subject,
  };
}

function getSubjectContent(subject, idx) {
  const safeIdx = Math.min(3, Math.max(0, Number(idx) || 1));
  return {
    expert: SUBJECT_EXPERT_ESSENCE[subject] || "",
    mirror: (SUBJECT_MIRROR_READING[subject] && SUBJECT_MIRROR_READING[subject][safeIdx]) || "",
    remedy: (SUBJECT_TACTICAL_REMEDIES[subject] && SUBJECT_TACTICAL_REMEDIES[subject][safeIdx]) || {}
  };
}

function buildSubjectPageHTML(subject, data, marksBySubject) {
  const qKey = SUBJECT_QUESTION_KEY[subject];
  // Safe index parser (0, 1, 2, or 3)
  const idx = Math.min(3, Math.max(0, Number(data?.answers?.[qKey]) || 1));
  const marks = (marksBySubject && marksBySubject[subject]) ? marksBySubject[subject] : 45;

  const expertText = SUBJECT_EXPERT_ESSENCE[subject] || "";
  const mirrorText = (SUBJECT_MIRROR_READING[subject] && SUBJECT_MIRROR_READING[subject][idx]) 
    || SUBJECT_MIRROR_READING[subject][1];
  const remedyObj = (SUBJECT_TACTICAL_REMEDIES[subject] && SUBJECT_TACTICAL_REMEDIES[subject][idx]) 
    || SUBJECT_TACTICAL_REMEDIES[subject][1];
  const balanceDirective = typeof getCrossSubjectDirective === "function" 
    ? getCrossSubjectDirective(subject, marksBySubject || {}) 
    : "";

  return `
    <div class="subj-stand-wrap">
      ${buildCombinedStandGauge(marks, SUBJECT_LABEL[subject])}
    </div>

    <!-- 1. The Subject Master & Strategist -->
    <div class="subj-box-expert">
      <div class="subj-badge badge-expert">⚡ THE MASTER'S PERSPECTIVE & TACTICAL EDGE</div>
      <div class="subj-expert-text">${expertText}</div>
    </div>

    <!-- 2. The Diagnostic Mirror (Exam Reality) -->
    <div class="subj-box-mirror">
      <div class="subj-badge badge-mirror">🔍 THE DIAGNOSTIC MIRROR: YOUR EXAM REALITY</div>
      <div class="subj-mirror-text">${mirrorText}</div>
    </div>

    <!-- 3. The Tactical Remedy & One Piece of Advice -->
    <div class="subj-box-remedy">
      <div class="subj-badge badge-remedy">🎯 THE STRATEGIC PRESCRIPTION</div>
      <div class="subj-remedy-text">${remedyObj.action}</div>
      ${balanceDirective ? `<div class="subj-balance-banner">${balanceDirective}</div>` : ""}
      <div class="subj-advice-box">${remedyObj.lesson}</div>
    </div>
  `;
}

function buildSubjectPageHTML(subject, data, marksBySubject) {
  const qKey = SUBJECT_QUESTION_KEY[subject];
  // Safe index parser (0, 1, 2, or 3)
  const idx = Math.min(3, Math.max(0, Number(data?.answers?.[qKey]) || 1));
  const marks = (marksBySubject && marksBySubject[subject] !== undefined) 
    ? marksBySubject[subject] 
    : 45;

  // 1. Subject Master / Expert Text
  const expertText = (SUBJECT_EXPERT_ESSENCE && SUBJECT_EXPERT_ESSENCE[subject]) 
    || "Mastering this subject requires strong fundamentals and tactical question selection.";

  // 2. Diagnostic Mirror Text
  const mirrorText = (SUBJECT_MIRROR_READING && SUBJECT_MIRROR_READING[subject] && SUBJECT_MIRROR_READING[subject][idx])
    || (SUBJECT_MIRROR_READING && SUBJECT_MIRROR_READING[subject] && SUBJECT_MIRROR_READING[subject][1])
    || "You are losing marks to avoidable translation errors under timed test pressure.";

  // 3. Tactical Remedy & One Piece of Advice
  const remedyObj = (SUBJECT_TACTICAL_REMEDIES && SUBJECT_TACTICAL_REMEDIES[subject] && SUBJECT_TACTICAL_REMEDIES[subject][idx])
    || (SUBJECT_TACTICAL_REMEDIES && SUBJECT_TACTICAL_REMEDIES[subject] && SUBJECT_TACTICAL_REMEDIES[subject][1])
    || { 
      action: "Focus on high-yield chapters and solve 15 timed PYQs daily.", 
      lesson: "One Piece of Advice: Standardize your baseline before chasing complex multi-concept questions." 
    };

  // Cross-Subject Balance Banner
  const balanceDirective = typeof getCrossSubjectDirective === "function" 
    ? getCrossSubjectDirective(subject, marksBySubject || {}) 
    : "";

  return `
    <div class="subj-stand-wrap">
      ${buildCombinedStandGauge(marks, SUBJECT_LABEL[subject])}
    </div>

    <!-- 1. THE SUBJECT MASTER & STRATEGIST -->
    <div class="subj-box-expert">
      <div class="subj-badge badge-expert">⚡ THE MASTER'S PERSPECTIVE & TACTICAL EDGE</div>
      <div class="subj-expert-text">${expertText}</div>
    </div>

    <!-- 2. THE DIAGNOSTIC MIRROR (TEST-HALL REALITY) -->
    <div class="subj-box-mirror">
      <div class="subj-badge badge-mirror">🔍 THE DIAGNOSTIC MIRROR: YOUR EXAM REALITY</div>
      <div class="subj-mirror-text">${mirrorText}</div>
    </div>

    <!-- 3. THE TACTICAL REMEDY & CROSS-SUBJECT BALANCE -->
    <div class="subj-box-remedy">
      <div class="subj-badge badge-remedy">🎯 THE STRATEGIC PRESCRIPTION</div>
      <div class="subj-remedy-text">${remedyObj.action}</div>
      ${balanceDirective ? `<div class="subj-balance-banner">${balanceDirective}</div>` : ""}
      <div class="subj-advice-box">${remedyObj.lesson}</div>
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
/* PAGES 3a/3b/3c: 3-TIER PERSONA SUBJECT ARCHITECTURE       */
/* (Expertise -> Diagnostic Mirror -> Remedy & Advice)       */
/* ========================================================= */
.subj-content {
  position: absolute;
  top: 165px;
  left: 50px;
  width: 693px;
  display: flex;
  flex-direction: column;
  gap: 12px; /* Tight, proportional spacing to fit all 3 sections cleanly */
  box-sizing: border-box;
}

.subj-stand-wrap {
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
}

/* --- SECTION BADGES --- */
.subj-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  padding: 2.5px 9px;
  border-radius: 6px;
  margin-bottom: 7px;
}
.badge-expert {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid #cbd5e1;
}
.badge-mirror {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}
.badge-remedy {
  background: rgba(198, 40, 40, 0.08);
  color: #991b1b;
  border: 1px solid rgba(198, 40, 40, 0.22);
}

/* --- BOX 1: THE SUBJECT EXPERT & MASTER PERSPECTIVE --- */
.subj-box-expert {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-left: 6px solid #1e293b;
  border-radius: 18px;
  padding: 14px 20px;
  box-sizing: border-box;
}
.subj-expert-text {
  font-size: 14px;
  line-height: 1.52;
  color: #1e293b;
  font-weight: 700;
}

.subj-box-mirror {
  background: #FFFDF5;
  border: 1.5px solid #fed7aa;
  border-left: 6px solid #d97706;
  border-radius: 18px;
  padding: 15px 20px;
  box-sizing: border-box;
}
.subj-mirror-text {
  font-size: 14.5px;
  line-height: 1.54;
  color: #334155;
  font-weight: 700;
}

.subj-box-remedy {
  background: #FFFAE5;
  border: 2px solid #fed7aa;
  border-left: 6px solid #c62828;
  border-radius: 20px;
  padding: 16px 22px;
  box-sizing: border-box;
}
.subj-remedy-text {
  font-size: 14.5px;
  line-height: 1.52;
  color: #1e293b;
  font-weight: 700;
  margin-bottom: 10px;
}
.subj-balance-banner {
  background: rgba(254, 215, 170, 0.55);
  border-radius: 10px;
  padding: 8px 13px;
  margin-bottom: 10px;
  font-size: 13.5px;
  font-weight: 800;
  color: #7a1010;
  line-height: 1.45;
}
.subj-advice-box {
  background: #ffffff;
  border: 1.5px dashed #c62828;
  border-radius: 12px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 800;
  color: #7a1010;
  line-height: 1.48;
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

<!-- ========================================================= -->
<!-- PAGES 3a, 3b, 3c: 3-TIER SUBJECT DEEP DIVES               -->
<!-- ========================================================= -->

<!-- PAGE 3a: PHYSICS DEEP DIVE -->
<div class="page">
  <img src="${images.p3a}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <!-- Clickable overlay matching the Canva badge position (offset for left doodle) -->
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

<!-- PAGE 6: R.E.F & BARRIER (WITH SECTION HEADINGS) -->
<div class="page">
  <img src="${images.p6}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
    <div class="p6-flow-wrap">
      
      <!-- 1. Top Card: Structured R.E.F Analysis -->
      <div 
        class="p6-card-ref" 
        style="padding: ${p6Padding}; font-size: ${p6FontSize}; line-height: ${p6LineHeight};"
      >
        <div>${refBlocksHTML}</div>
        <div class="p6-closing-note" style="font-size: ${p6FontSize};">
          This is a discipline issue, not a knowledge issue, and it's exactly the kind of pattern a mentor spots before you do, because you can't see your own blind spots from inside them.
        </div>
      </div>

      <!-- 2. Section Heading -->
      <div 
        class="p6-section-title" 
        style="margin: ${p6TitleMargin}; font-size: ${p6TitleSize};"
      >
        BIGGEST BARRIER & MINDSET
      </div>

      <!-- 3. Bottom Card: Barrier & Mindset -->
      <div 
        class="p6-card-barrier" 
        style="padding: ${p6Padding}; font-size: ${p6FontSize}; line-height: ${p6LineHeight};"
      >
        <div>
          <div class="ref-badge" style="margin-bottom: 8px;">🛑 CORE BEHAVIORAL BLOCK</div>
          <div>${barrierNotes}</div>
        </div>
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

<!-- MINDSET SYSTEMS -->
<div class="page">
  <img src="${images.p6b}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <a href="https://www.jeesociety.in" target="_blank" class="pill-link-standard"></a>
  </div>
</div>

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