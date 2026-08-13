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

// ---------- NEW: mentorship-pressure helpers ----------

// Rank Degradation Warning (page 1): NOT based on expected/potential
// percentile anymore (dropped per request). Instead built purely from
// their reported daily execution pattern — Q2 (deep-work hours bracket)
// gives a base hours estimate, Q19 (active vs passive study ratio) scales
// it down for how much of that time is genuinely active/effective. Both
// numbers are real answers, not invented. Includes a visual bar
// comparison (You vs a Topper Benchmark) alongside the supporting text.
const Q2_BASE_HOURS = [6.5, 5, 2, 1.5];       // Deep Focus / Standard Grind / Passive / Distracted
const Q19_ACTIVE_MULTIPLIER = [0.3, 0.5, 0.8, 1.0]; // same scale as score.js's Q19_MULTIPLIER
const TOPPER_BENCHMARK_HOURS = 6.0;
const BAR_SCALE_MAX = 8; // hours represented by a full-width bar

function buildRankDegradationWarning(data) {
  const q2Idx = Number(data.answers?.q2);
  const q19Idx = Number(data.answers?.q19);

  const baseHours = Q2_BASE_HOURS[q2Idx] !== undefined ? Q2_BASE_HOURS[q2Idx] : 3.5;
  const activeMultiplier = Q19_ACTIVE_MULTIPLIER[q19Idx] !== undefined ? Q19_ACTIVE_MULTIPLIER[q19Idx] : 0.6;
  const effectiveHours = Math.round(baseHours * activeMultiplier * 10) / 10;
  const deficit = Math.max(0, Math.round((TOPPER_BENCHMARK_HOURS - effectiveHours) * 10) / 10);
  const atRisk = deficit >= 1.5;

  const youBarWidth = Math.min(100, Math.round((effectiveHours / BAR_SCALE_MAX) * 100));
  const benchmarkBarWidth = Math.min(100, Math.round((TOPPER_BENCHMARK_HOURS / BAR_SCALE_MAX) * 100));

  const warnIcon = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;">
      <path d="M12 3L2 20h20L12 3z" fill="${atRisk ? "#dc2626" : "#16a34a"}" opacity="0.15"/>
      <path d="M12 3L2 20h20L12 3z" stroke="${atRisk ? "#dc2626" : "#16a34a"}" stroke-width="1.8" stroke-linejoin="round" fill="none"/>
      ${atRisk
        ? `<line x1="12" y1="10" x2="12" y2="15" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
           <circle cx="12" cy="17.3" r="1.1" fill="#dc2626"/>`
        : `<path d="M9 12.5l2 2 4-4.5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
      }
    </svg>
  `;

  const bars = `
    <div style="margin-top:10px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
        <div style="width:120px; font-size:11.5px; font-weight:700; color:#4a0402;">You (effective)</div>
        <div style="flex:1; height:10px; background:#f1f1f1; border-radius:5px; overflow:hidden;">
          <div style="height:100%; width:${youBarWidth}%; background:${atRisk ? "#dc2626" : "#16a34a"}; border-radius:5px;"></div>
        </div>
        <div style="width:60px; font-size:11.5px; font-weight:800; color:#4a0402; text-align:right;">${effectiveHours}h/day</div>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:120px; font-size:11.5px; font-weight:700; color:#4a0402;">Topper Benchmark</div>
        <div style="flex:1; height:10px; background:#f1f1f1; border-radius:5px; overflow:hidden;">
          <div style="height:100%; width:${benchmarkBarWidth}%; background:#94a3b8; border-radius:5px;"></div>
        </div>
        <div style="width:60px; font-size:11.5px; font-weight:800; color:#4a0402; text-align:right;">${TOPPER_BENCHMARK_HOURS}h/day</div>
      </div>
    </div>
  `;

  if (atRisk) {
    return {
      atRisk: true,
      html: `
        <div style="display:flex; align-items:flex-start; gap:10px;">
          ${warnIcon}
          <div style="flex:1;">
            <div style="font-weight:900; font-size:14px; letter-spacing:0.5px; color:#7a1010;">
              RANK DEGRADATION WARNING
            </div>
            <div style="font-size:13px; line-height:1.5; color:#4a0402; margin-top:4px;">
              At an estimated <b>${effectiveHours} effective hours/day</b>, you're running
              <b>${deficit}h/day below</b> the pace top scorers typically sustain. That's a small daily
              gap, but it compounds fast, most students who close it start seeing movement within
              2-3 weeks of fixing just this one pattern.
            </div>
            ${bars}
          </div>
        </div>
      `,
    };
  }

  return {
    atRisk: false,
    html: `
      <div style="display:flex; align-items:flex-start; gap:10px;">
        ${warnIcon}
        <div style="flex:1;">
          <div style="font-weight:900; font-size:14px; letter-spacing:0.5px; color:#14532d;">
            EXECUTION SIGNAL: STABLE
          </div>
          <div style="font-size:13px; line-height:1.5; color:#14532d; margin-top:4px;">
            At an estimated <b>${effectiveHours} effective hours/day</b>, you're already close to the pace
            top scorers sustain. Protect this, it's one of your strongest signals right now.
          </div>
          ${bars}
        </div>
      </div>
    `,
  };
}

// NOTE: the 5-systems checklist text lives directly in
// page6b_mindset_systems.png now (static, not code-generated) — see the
// copy-paste content list provided separately for the exact wording.

// =========================================================
// SUBJECT DEEP-DIVE PAGES (Physics / Chemistry / Maths)
// =========================================================

// Illustrative marks estimate per qualitative answer — framed to the
// student as an estimate based on their self-rating, never as their
// literal real exam score (we don't collect actual numeric marks).
const MARKS_ESTIMATE = {
  physics: [72, 52, 28, 65],   // Strong, Average, Weak, Comfort Trap
  chemistry: [75, 50, 25, 45], // Strong, Average, Weak, Volatile — NOTE: q5 option order is Strong/Volatile/Weak/Average
  maths: [70, 40, 15, 35],     // Killer, Survivor, Phobia, Ego Lifter
};
// q5's actual option order (see QUESTIONS in assessment.jsx) is:
// 0 Strong, 1 Volatile, 2 Weak, 3 Average — reordering the estimate array
// to match that exactly:
MARKS_ESTIMATE.chemistry = [75, 45, 25, 50]; // Strong, Volatile, Weak, Average

const SUBJECT_QUESTION_KEY = { physics: "q4", chemistry: "q5", maths: "q6" };
const SUBJECT_LABEL = { physics: "Physics", chemistry: "Chemistry", maths: "Maths" };

function estimateMarks(subject, idx) {
  const arr = MARKS_ESTIMATE[subject];
  return arr[idx] !== undefined ? arr[idx] : 45;
}

// Affirmation shown instead of a case study for the top bracket in each
// subject (idx 0) — a "problem-solved" case study would ring false for
// someone who doesn't have that problem.
const SUBJECT_AFFIRMATION = {
  physics: "Physics is already your anchor. Protect it, don't let it quietly eat time that Chemistry or Maths actually needs.",
  chemistry: "Chemistry is already working for you. Keep the revision light and consistent, don't let it slip while you focus elsewhere.",
  maths: "You're already ahead of most aspirants in Maths. Push for 90+ instead of \"good enough\", it's the subject NTA checks first in a tie.",
};

// 9 case studies total (3 archetypes x 3 subjects), matched to whichever
// non-top option they picked for that subject.
const CASE_STUDIES = {
  physics: {
    1: { // "Average" — stuck, understands concepts but freezes on unfamiliar problems
      story: "You know what, one student from our mentorship was in a pretty similar spot with Physics. He scored consistently 45-50/100 for months, understood every concept in class but froze on anything unfamiliar in mocks. We didn't add more theory. We made him solve 15 previous-year Physics questions daily from only 4 chapters, Rotational Motion, Electrostatics, Current Electricity, and Modern Physics, without watching a single new lecture. Three weeks later his Physics score was 68/100. He wasn't missing knowledge, he was missing exposure to how JEE actually twists standard concepts.",
      takeaway: "Lesson for you: Stop watching more lectures. You already know the theory. Solve 15 PYQs a day from your weakest 4 chapters before touching anything new.",
    },
    2: { // "Weak" — struggles with basics
      story: "Funny thing, I had a student last year who thought he \"just wasn't a Physics person.\" He was scoring under 20/100, convinced it was a talent problem. We checked his basics instead: Vectors, Units and Dimensions, Kinematics, all shaky. We stopped him from touching Modern Physics or Electrostatics entirely for 3 weeks, pure NCERT-level basics, nothing else. When he came back to the harder chapters, they suddenly made sense. He jumped to 44/100 in the very next mock.",
      takeaway: "Lesson for you: You're not bad at Physics, you're missing the foundation Physics is built on. Go back to Vectors and Kinematics before anything else.",
    },
    3: { // "Comfort Trap" — over-invests in strongest subject
      story: "Here's something I've seen a lot, actually. One mentee of ours was already scoring 78/100 in Physics and kept spending 4+ hours a day on it anyway, because it felt productive and he genuinely enjoyed it. Meanwhile his Chemistry sat at 30/100. We capped his Physics time at 45 minutes a day, revision only, no new content, and moved those hours to Chemistry. His Physics score barely moved, 79 to 81. His Chemistry jumped from 30 to 58 in six weeks.",
      takeaway: "Lesson for you: The subject you love most is probably not the one costing you the most marks. Cap your time on it and redirect the hours to whichever subject you're avoiding.",
    },
  },
  chemistry: {
    1: { // "Volatile" — memorizes but forgets fast
      story: "I remember one student telling me Chemistry felt like it kept slipping through his fingers. He could recall every reaction perfectly the day after studying it, and completely forget it three days later. His Chemistry score swung between 25 and 60 depending on how recently he'd revised. We put him on a strict cycle: revisit every topic on Day 1, Day 3, and Day 7 after first studying it, no exceptions. Six weeks later his lowest Chemistry mock score was 55, and it stopped swinging.",
      takeaway: "Lesson for you: Your problem isn't understanding, it's retention. Fixed-interval revision (Day 1, 3, 7) matters more than how many new topics you cover.",
    },
    2: { // "Weak" — avoids the subject
      story: "One of our mentees genuinely avoided Chemistry like the plague, barely opened the book, and was scoring under 15/100. We didn't ask him to love it. We picked the single highest-yield, lowest-effort chapter, Chemical Bonding, gave him just the NCERT lines and 20 PYQs, nothing else. He scored 14/20 on those PYQs on his first attempt, his first real \"win\" in Chemistry in months. That one win changed how he approached the whole subject.",
      takeaway: "Lesson for you: You don't need to fix your relationship with Chemistry. You need one small, fast win to prove to yourself you can actually do this.",
    },
    3: { // "Average" — uneven across sub-topics
      story: "Here's an interesting one. A student of ours was almost perfect in half of Chemistry, near-perfect on Mole Concept and Thermodynamics, but scored almost zero on Organic reaction mechanisms, treating them as \"impossible to memorize.\" We reframed Organic as logic, not memory: 6 reaction \"families\" instead of 200 individual reactions. Within a month his Organic-specific score went from 8/40 to 26/40.",
      takeaway: "Lesson for you: Your strong half is fine, don't touch it. Your weak half needs a different strategy, most likely you're studying it the wrong way, not too little.",
    },
  },
  maths: {
    1: { // "Survivor" — narrow safe-zone chapters only
      story: "One mentee of ours only ever touched the \"safe\" chapters in Maths, Vectors, 3D Geometry, Straight Lines, and skipped everything else, hard-capped at 45/100 no matter what. We forced him to add just one new chapter every 10 days, starting with Permutations & Combinations. His ceiling broke for the first time in months, 45 became 58, then 64.",
      takeaway: "Lesson for you: Your safe zone has a hard ceiling. Every chapter you refuse to touch is a ceiling you've built yourself.",
    },
    2: { // "Phobia"
      story: "You know what, one student of ours was in your exact spot. Maths felt impossible, he'd scored 12/100 for two straight mocks and was ready to write it off completely. We didn't ask him to love Maths. We asked him to master exactly 4 chapters, Quadratic Equations, Sets & Relations, Statistics, and Straight Lines, the most formula-based, least \"clever-thinking-required\" chapters in the syllabus. Six weeks later his Maths score was 46/100. His overall percentile jumped more from that than from anything he did in Physics or Chemistry that term.",
      takeaway: "Lesson for you: Stop trying to complete the full Maths syllabus. Target the 4 chapters above first, they reward formula-memorization, not \"genius,\" and they're worth real marks.",
    },
    3: { // "Ego Lifter" — chases hard problems for pride
      story: "I've seen this one a lot, honestly. A mentee would spend 25 minutes on a single hard integration problem \"on principle,\" refusing to move on, while 3 easy Matrices questions worth the same total marks sat untouched. We banned him from attempting anything he couldn't solve in under 3 minutes during practice, no exceptions, for two weeks. His accuracy on easy-to-medium questions went from 60% to 91%, and his Maths score jumped 22 points without him getting \"smarter\" at all.",
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

// Cross-subject "compensation" detection: is this subject a clear weak
// outlier relative to the other two? Uses ESTIMATED MARKS (not raw
// option index), since e.g. Physics "Comfort Trap" is actually a high
// mark despite being option index 3.
function detectCompensation(subject, marksBySubject) {
  const others = Object.keys(marksBySubject).filter((k) => k !== subject);
  const otherAvg = others.reduce((sum, k) => sum + marksBySubject[k], 0) / others.length;
  const gap = otherAvg - marksBySubject[subject];
  if (gap < 20) return null; // not a meaningful imbalance

  const strongerSubject = others.reduce((a, b) => (marksBySubject[a] > marksBySubject[b] ? a : b));
  return {
    gap: Math.round(gap),
    strongerLabel: SUBJECT_LABEL[strongerSubject],
    weakerLabel: SUBJECT_LABEL[subject],
  };
}

// Accurate (fact-checked) tie-break insight — NTA JEE Main 2025 tie-break
// order is Maths, then Physics, then Chemistry, then accuracy ratio, then
// age, when candidates land on the same total score.
function buildTieBreakInsight(subject) {
  if (subject === "maths") {
    return `Because thousands of aspirants land on near-identical total scores every year, ties are common. When they happen, NTA resolves them using <b>Maths score first</b>, before Physics or Chemistry are even considered. A weak Maths score doesn't just cost you marks directly, it also puts you at a real disadvantage against equally-scored peers when final ranks get assigned.`;
  }
  if (subject === "physics") {
    return `If your total score ties with another aspirant's, NTA checks Maths first, then <b>Physics second</b>. Physics is your tie-break safety net, worth strengthening even beyond what your total score alone suggests.`;
  }
  return `Chemistry is checked last in NTA's tie-break order (after Maths, then Physics), but with lakhs of aspirants landing on similar totals, even a "last resort" tie-breaker resolves real ranks every single year.`;
}

// Modest, achievable next target (not a final goal) — avoids specific
// rank-number claims per your call to keep this illustrative.
function buildModestTarget(subject, currentMarks) {
  const nextMilestone = Math.min(65, Math.round((currentMarks + 20) / 5) * 5);
  const questionsNeeded = Math.round((nextMilestone - currentMarks) / 4);
  return `You don't need to master ${SUBJECT_LABEL[subject]}. Moving from your current estimated <b>${currentMarks} marks</b> to just <b>${nextMilestone} marks</b> (roughly ${Math.max(1, questionsNeeded)} more correct questions) would meaningfully change your competitive position, especially given how tie-breaks work.`;
}

// --- Visuals: Temperature Gauge + Peer Position Bar (CSS-built, like the
// Rank Degradation bars — no image needed, moves per student). ---
function buildTemperatureGauge(marks) {
  const pct = Math.max(0, Math.min(100, marks));
  return `
    <div style="margin-top:8px;">
      <div style="height:14px; border-radius:8px; background:linear-gradient(90deg, #2563eb 0%, #06b6d4 25%, #facc15 50%, #fb923c 75%, #dc2626 100%); position:relative; box-shadow: inset 0 1px 2px rgba(0,0,0,0.08);">
        <div style="position:absolute; top:-6px; left:${pct}%; transform:translateX(-50%); width:0; height:0; border-left:7px solid transparent; border-right:7px solid transparent; border-top:9px solid #111;"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:11px; color:#888; margin-top:4px;">
        <span>Cold</span><span>Warm</span><span>Hot</span>
      </div>
    </div>
  `;
}

function buildPeerPositionBar(marks) {
  const AVERAGE_ASPIRANT_BENCHMARK = 45; // honest flat reference, not a real-data claim
  const youPct = Math.max(2, Math.min(98, marks));
  const avgPct = AVERAGE_ASPIRANT_BENCHMARK;

  // When the two markers land close together, their labels collide
  // horizontally (both centered near the same x position). Fix: give the
  // container extra height and flip "You"'s label to sit ABOVE its line
  // instead of below, so the two labels separate vertically instead of
  // overlapping.
  const isClose = Math.abs(youPct - avgPct) < 15;
  const containerHeight = isClose ? 56 : 34;
  const trackTop = isClose ? 36 : 14;

  const avgLine = `<div style="position:absolute; top:${isClose ? 14 : 0}px; width:2px; height:22px; background:#94a3b8; left:50%; transform:translateX(-50%);"></div>`;
  const avgLabel = `<div style="position:absolute; top:${isClose ? 38 : 24}px; width:90px; left:50%; transform:translateX(-50%); font-size:10px; color:#64748b; font-weight:700; white-space:nowrap; text-align:center;">Typical Aspirant</div>`;

  const youBlock = isClose
    ? `<div style="position:absolute; top:0; width:60px; left:50%; transform:translateX(-50%); font-size:10px; color:#c62828; font-weight:800; text-align:center;">You</div>
       <div style="position:absolute; top:12px; width:2px; height:24px; background:#c62828; left:50%; transform:translateX(-50%);"></div>`
    : `<div style="position:absolute; top:0; width:2px; height:22px; background:#c62828; left:50%; transform:translateX(-50%);"></div>
       <div style="position:absolute; top:24px; width:60px; left:50%; transform:translateX(-50%); font-size:10px; color:#c62828; font-weight:800; text-align:center;">You</div>`;

  return `
    <div style="margin-top:6px; position:relative; height:${containerHeight}px;">
      <div style="position:absolute; top:${trackTop}px; left:0; right:0; height:8px; background:#f1f1f1; border-radius:5px;"></div>
      <div style="position:absolute; top:0; left:${avgPct}%; height:100%; width:1px;">${avgLine}${avgLabel}</div>
      <div style="position:absolute; top:0; left:${youPct}%; height:100%; width:1px;">${youBlock}</div>
    </div>
  `;
}

// Builds the full content-layer HTML for one subject's deep-dive page.
function buildSubjectPageHTML(subject, data, marksBySubject) {
  const qKey = SUBJECT_QUESTION_KEY[subject];
  const idx = Number(data.answers?.[qKey]);
  const marks = marksBySubject[subject];
  const content = getSubjectContent(subject, idx);
  const compensation = detectCompensation(subject, marksBySubject);

  const compensationBlock = compensation ? `
    <div class="subj-compensation">
      We noticed your ${compensation.strongerLabel} standing is significantly higher than your ${compensation.weakerLabel}.
      You may be trying to compensate by pushing ${compensation.strongerLabel} harder, here's the math on why that
      strategy doesn't fully work: even a strong ${compensation.strongerLabel} score can't offset a
      ${compensation.gap}-mark gap in ${compensation.weakerLabel}, because your overall rank is driven by the total
      across all three subjects, not any single one.
    </div>
  ` : "";

  const caseStudyBlock = content.isAffirmation ? `
    <div class="subj-affirmation">${content.text}</div>
  ` : `
    <div class="subj-case-study">
      <div class="subj-case-story">${content.story}</div>
      <div class="subj-case-takeaway">${content.takeaway}</div>
    </div>
  `;

  return `
    <div class="subj-gauge-label">Where You Stand: ${SUBJECT_LABEL[subject]}</div>
    ${buildTemperatureGauge(marks)}
    <div class="subj-peer-label">Peer Position</div>
    ${buildPeerPositionBar(marks)}
    ${compensationBlock}
    <div class="subj-tiebreak">${buildTieBreakInsight(subject)}</div>
    <div class="subj-target">${buildModestTarget(subject, marks)}</div>
    ${caseStudyBlock}
  `;
}

// ---------- main ----------
async function generatePDF(data) {

  const attemptType = data.target_attempt && data.target_attempt.includes("2028") ? "2028" : "2027";
  const prevYearChapters = attemptType === "2028" ? "2027" : "2026"; 

  const score = parseInt(data.jee_society_score) || 60;
  const readinessGap = 100 - score;
  const studentName = data.name || "Student";

  const rankWarning = buildRankDegradationWarning(data);

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
    p4: getAsset("page4_mapping_2028.png"),
    p5: getAsset("page5_peer.png"),
    p6: getAsset("page6_ref.png"),
    p6b: getAsset("page6b_mindset_systems.png"), // NEW: enlarged Mindset page
    p7: getAsset("page7_health.png"),
    p8: getAsset("page8_exec.png"),
    p9: getAsset("page9_parents.png"),
    p10: getAsset("page10_roadmap_2028.png"),
    p11: getAsset("page11_conclusion.png"),
    p12: getAsset("page12_habit.png"),
    p13: getAsset("page13_mock.png"),
    p14: getAsset("page14_mock_analysis_guide.png"), // NEW: final page, fully static
    sundayTracker: getAsset("sunday_tracker.png"),
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
.p2-score { top: 82px; left: 65px; font-size: 24px; color: #a40000; font-weight: 800; }
.p2-gap { top: 158px; left: 116px; font-size: 25px; color: #a40000; }

/* PAGE 2: RANK DEGRADATION WARNING (moved here from page 1 per request)
   Sits between the Score/Readiness-Gap box above and the Founder's Note
   box below. Lifted up from 360px to 300px since it was overlapping the
   Founder's Note box below it. You mentioned also lifting the JSS
   score/gap section up on your end, so this will likely need another
   pass once both moves settle, send an updated screenshot and I'll
   recalibrate. */
.p2-rank-warning {
  position: absolute; top: 260px; left: 40px; width: 713px;
  padding: 16px 20px; border-radius: 12px; box-sizing: border-box;
  background: ${rankWarning.atRisk ? "#fff1f1" : "#f0fdf4"};
  border: 1.5px solid ${rankWarning.atRisk ? "#f3b4b4" : "#bbf7d0"};
}

/* PAGES 3a/3b/3c: SUBJECT DEEP-DIVES (Physics / Chemistry / Maths)
   One shared template, positioned identically on all 3 pages (assuming
   you design all 3 background images with matching layout, easiest for
   consistency). PLACEHOLDER coordinates — these are brand-new pages, so
   send me the actual designs and I'll calibrate exactly. */
.subj-content { position: absolute; top: 180px; left: 55px; width: 683px; }
.subj-gauge-label { font-size: 14px; font-weight: 800; color: #222; margin-bottom: 4px; }
.subj-peer-label { font-size: 14px; font-weight: 800; color: #222; margin-top: 22px; margin-bottom: 4px; }
.subj-compensation {
  margin-top: 22px; padding: 14px 16px; border-radius: 10px;
  background: #fff7ed; border: 1px solid #fed7aa;
  font-size: 13.5px; line-height: 1.55; color: #7c2d12;
}
.subj-tiebreak {
  margin-top: 16px; font-size: 13px; line-height: 1.55; color: #444;
  padding: 12px 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;
}
.subj-target {
  margin-top: 14px; font-size: 13.5px; line-height: 1.55; color: #14532d;
  padding: 12px 14px; background: #f0fdf4; border-radius: 10px; border: 1px solid #bbf7d0;
}
.subj-affirmation {
  margin-top: 20px; font-size: 15px; line-height: 1.6; color: #333; font-style: italic;
}
.subj-case-study { margin-top: 20px; }
.subj-case-story { font-size: 13.5px; line-height: 1.6; color: #333; margin-bottom: 8px; }
.subj-case-takeaway { font-size: 13.5px; line-height: 1.55; color: #4a0402; font-weight: 700; }

/* PAGE 5: PEER COMPARISON */
.p5-score-top { top: 164px; left: 466px; font-size: 22px; color: #a40000; }

/* PAGE 6: R.E.F & BARRIER */
.p6-ref { top: 230px; left: 90px; width: 610px; line-height: 1.7; color: #4a0402; }
.p6-barrier { top: 780px; left: 90px; width: 610px; line-height: 1.7; color: #4a0402; }

/* PAGE 6b (NEW — needs page6b_mindset_systems.png): no dynamic CSS needed
   here, all text/checkboxes/writing-lines are static, baked into the image. */

/* PAGE 7: HEALTH */
.health-item { position: absolute; left: 90px; width: 610px; line-height: 1.6; color: #4a0402; font-size: 16px; }
.h-item1 { top: 195px; }
.h-item2 { top: 405px; }
.h-item3 { top: 625px; }
.h-item4 { top: 835px; }

/* PAGE 8: EXECUTION PLAN
   Shifted up ~43px from the original (292→249, etc.) to match the
   updated page8_exec.png, same 113px spacing between steps as before.
   Step 8 now has its own numeral graphic in the image, so it uses the
   same .exec-item styling as 1-7 instead of the old plain-text fallback. */
.exec-item { position: absolute; left: 140px; width: 550px; font-size: 15px; line-height: 1.5; color: #4a0402; font-weight: 600; }
.ex1 { top: 231px; }
.ex2 { top: 344px; }
.ex3 { top: 457px; }
.ex4 { top: 570px; }
.ex5 { top: 683px; }
.ex6 { top: 796px; }
.ex7 { top: 909px; }
.ex8 { top: 1022px; }

/* PAGE 9: NOTE TO PARENTS — the new parents line is static text baked
   directly into page9_parents.png (see instructions), no CSS needed here. */

/* PAGE 11: CONCLUSION */
.p11-conc { top: 390px; left: 140px; width: 520px; font-size: 20px; line-height: 1.8; color: #5c1a1a; }

/* PAGE 13: MOCK TRACKER — the mentor-review footer line is now static
   text baked directly into page13_mock.png, no CSS needed here. */

/* =========================================
   THE MASKING ENGINE (used only for the subject-year black box)
   ========================================= */
.black-mask { 
  position: absolute; background: #000; color: #ffd700; font-weight: 900; 
  text-align: center; font-size: 32px; z-index: 20; top: 57px; left: 141px; 
  width: 130px; height: 45px; line-height: 45px; border-radius: 8px;
}

/* PAGE 12/13 (printables): Name/Target overlay.
   Previously drew a solid white rectangle to cover a placeholder and put
   text inside it, that's why it never lined up with your actual design.
   Removed the cover-up entirely — this now just places plain text
   directly, meant to sit INSIDE the pre-designed bordered box (like your
   Harshita reference), not replace/cover anything. No Expected/Potential
   percentile, just Name + Target, per your note.
   PLACEHOLDER coordinates — send me the updated page12/13 images (or
   just where the box sits) and I'll line this up exactly. */
.printable-header {
  position: absolute; font-size: 15px; font-weight: 700; color: #222;
}
.p12-header { top: 108px; left: 60px; }
.p13-header { top: 108px; left: 60px; }

/* PAGE 14: Mock Analysis Guide — name goes on the blank "Name:" line.
   PLACEHOLDER coordinates, estimated from your screenshot, not measured
   exactly. Send a render and I'll true it up to sit right on the line. */
.p14-name { top: 151px; left: 90px; font-size: 15px; font-weight: 700; }
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
    <div class="p2-rank-warning">${rankWarning.html}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p3a}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="subj-content">${buildSubjectPageHTML("physics", data, marksBySubject)}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p3b}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="subj-content">${buildSubjectPageHTML("chemistry", data, marksBySubject)}</div>
  </div>
</div>

<div class="page">
  <img src="${images.p3c}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="subj-content">${buildSubjectPageHTML("maths", data, marksBySubject)}</div>
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
    <div class="dynamic-text p6-ref">
      ${joinMentorNotes(["q7","q8","q10"], data)}
      <br><br>
      This is a discipline issue, not a knowledge issue, and it's exactly the kind of pattern a mentor
      spots before you do, because you can't see your own blind spots from inside them.
    </div>
    <div class="dynamic-text p6-barrier">
      ${get("q11", data)?.mentor_note || "Barrier notes..."}
    </div>
  </div>
</div>

<!-- PAGE 6b: ENLARGED MINDSET SECTION (NEW) — all text, checkboxes, and
     writing lines are static, baked directly into page6b_mindset_systems.png.
     No dynamic overlay needed, matches how page9 (Note to Parents) works. -->
<div class="page">
  <img src="${images.p6b}" class="bg-img" onerror="this.style.display='none'"/>
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
    <div class="exec-item ex1">${customSteps[0]}</div>
    <div class="exec-item ex2">${customSteps[1]}</div>
    <div class="exec-item ex3">${customSteps[2]}</div>
    <div class="exec-item ex4">${customSteps[3]}</div>
    <div class="exec-item ex5">${customSteps[4]}</div>
    <div class="exec-item ex6">${customSteps[5]}</div>
    <div class="exec-item ex7">${customSteps[6]}</div>
    <div class="exec-item ex8">Share this exact list with your mentor and ask them to check in on it in 7 days. Accountability from someone outside your own head changes follow-through more than willpower does.</div>
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
    <div class="printable-header p12-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target: ${attemptType}
    </div>
  </div>
</div>

<div class="page">
  <img src="${images.p13}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p13-header">
      Name: ${studentName} &nbsp;&nbsp;&nbsp; Target: ${attemptType}
    </div>
  </div>
</div>

<!-- PAGE 14: MOCK ANALYSIS GUIDE (NEW, final page) — only the Name is
     dynamic (goes on the blank "Name: ____" line), everything else on
     this page is static, same idea as pages 12/13's header. -->
<div class="page">
  <img src="${images.p14}" class="bg-img" onerror="this.style.display='none'"/>
  <div class="content-layer">
    <div class="printable-header p14-name">${studentName}</div>
  </div>
</div>

<!-- PAGE 15: SUNDAY TRACKER (NEW STATIC PAGE) -->
<div class="page">
  <img src="${images.sundayTracker}" class="bg-img" onerror="this.style.display='none'"/>
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
