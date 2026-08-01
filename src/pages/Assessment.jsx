import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../swot.css";
import { computeScores } from "../utils/score";
import { Helmet } from "react-helmet-async";

import {
  StrengthResponses,
  WeaknessResponses,
  OpportunityResponses,
  ThreatResponses,
} from "../ResponseBank";

// -------------------- QUESTIONS DATA --------------------
const QUESTIONS = [
  {
    id: "name",
    type: "text",
    question: "What is your name?"
  },
  // Q1 -> Strength (Primary)
  {
    id: "q1",
    swot: "S",
    impact: "primary",
    question: "Q1. Your Consistency Meter",
    options: [
      "The Machine: I study every single day without fail, hitting all my targets.",
      "The Weekend Warrior: I have 3-4 good days, but I waste 2-3 days feeling unmotivated.",
      "The Burst Worker: I study 14 hours one day, then burnout and do nothing for 2 days.",
      "The Procrastinator: I plan every night, but barely execute 20% of it the next day."
    ],
    weights: [10, 6, 4, 0]
  },
  // Q2 -> Strength (Secondary)
  {
    id: "q2",
    swot: "S",
    impact: "secondary",
    question: "Q2. Your \"Deep Work\" Reality",
    options: [
      "Deep Focus: 6+ hours of pure, phone-free study (excluding lectures).",
      "Standard Grind: 4-6 hours of self-study, but I take frequent breaks.",
      "Passive Consumption: I spend most of my time watching lectures/One-shots; barely 2 hours of solving.",
      "Distracted: I sit for 10 hours, but effective study is hardly 2 hours due to phone/daydreaming."
    ],
    weights: [10, 7, 3, 0]
  },
  // Q3 -> Weakness (Primary)
  {
    id: "q3",
    swot: "W",
    impact: "primary",
    question: "Q3. Your Syllabus Status:",
    options: [
      "On Track: 80%+ Syllabus done with proper problem solving.",
      "Manageable Debt: 50-80% done, but revision is pending.",
      "Panic Mode: Less than 50% done. I have huge backlogs in Class 11/12.",
      "Fresh Start: I am basically starting from zero right now."
    ],
    weights: [10, 6, 2, 2]
  },
  // Q4 -> Weakness (Secondary)
  {
    id: "q4",
    swot: "W",
    impact: "secondary",
    question: "Q4. How is your Physics (Honestly)?",
    options: [
      "Strong: I can solve JEE Mains PYQs accurately under timed practice now. ",
      "Average: I understand concepts but get stuck on tricky questions; I am giving it high priority. ",
      "Weak: I struggle with basics; I am ignoring them to focus on Chemistry/Math. ",
      "Comfort Trap: Physics is my strongest subject, yet I still spend 50%+ of my time watching videos on Physics because I like it. "
    ],
    weights: [10, 7, 3, 0]
  },
  // Q5 (Standard)
  {
    id: "q5",
    question: "Q5. How is your Chemistry(Honestly)?",
    options: [
      "Strong: NCERT is on my tips; I score high consistently. ",
      "Volatile: I memorize it, but forget it in 3 days; I spend time re-reading notes constantly. ",
      "Weak: I hate Chemistry; I barely touch this subject. ",
      "Average: I am good at any one part(OC/OC/P), and bad at one. "
    ],
    weights: [10, 6, 2, 4]
  },
  // Q6 (Standard)
  {
    id: "q6",
    question: "Q6. How is your Mathematics(Honestly)?",
    options: [
      "Killer: I love Math; I love solving complex problems in a given time. ",
      "Survivor: I only target specific high-weightage chapters (Vector/3D) to clear cutoff. ",
      "Phobia: I am terrified of Math; I haven't solved a question in weeks. ",
      "The Ego Lifter: I am weak, but I waste hours trying to solve impossible problems just to prove I can. "
    ],
    weights: [10, 7, 2, 3]
  },
  // Q7 (Standard)
  {
    id: "q7",
    question: "Q7. How is your Recall Strength in an exam setting?",
    options: [
      "Crystal Clear: I recall every formula while solving questions. ",
      "Blurry: I recognize the concept when I see the solution, but can't recall it during the question. ",
      "Leaky Bucket: I study a chapter, but 1 week later it feels like I never studied it. ",
      "Blank Out: I panic in tests and forget even the basics I knew well. "
    ],
    weights: [10, 7, 4, 0]
  },
  // Q8 (Standard)
  {
    id: "q8",
    question: "Q8. Go and solve JEE Mains PYQs of any chapter of Maths for an hour. Then choose an option that matches closely:",
    options: [
      "I solve 20+ MCQs per hour with high accuracy.",
      "I solve 10-15 MCQs per hour.",
      "I take 10 minutes per question (mostly staring at it).",
      "I don’t like solving questions at all."
    ],
    weights: [10, 7, 3, 0]
  },
  // Q9 (Standard)
  {
    id: "q9",
    question: "Q9. Tell us about your Attention span:",
    options: [
      "Deep Diver: I can sit for 3 hours straight without touching my phone.",
      "The Hopper: I study for 45 mins, then need a 15 min break.",
      "Reels Brain: My attention breaks every 10-15 minutes; I check notifications constantly.",
      "Daydreamer: I stare at the book, but my mind is thinking about college/life/backlog."
    ],
    weights: [10, 7, 3, 0]
  },
  // Q10 (Standard)
  {
    id: "q10",
    question: "Q10. The \"Error Pattern\" (Why do you generally lose marks?)",
    options: [
      "Conceptual: I honestly didn't know the theory/logic. ",
      "Silly/Calculation: I knew it, but made a silly mistake or read the question wrong. ",
      "Ego/Time: I got stuck on one hard question and wasted 10 minutes, ruining the paper. ",
      "Fear/Skipping: I skipped easy questions because the chapter \"looked\" scary. "
    ],
    weights: [0, 0, 0, 0]
  },
  // Q12 (Standard)
  {
    id: "q12",
    question: "Q12. This is a special question. You need to be utmost sincere while answering this. How is your mindset currently:",
    options: [
      "Warrior: \"I will crack JEE, no matter what. I just need the plan.\"",
      "Hopeful: \"I think I can get a good IIT/NIT, but I am sometimes uncertain.\"",
      "Doubter: \"I am trying, but deep down I feel I started too late and it’s close to impossible.\"",
      "Lost: \"I have given up. I am just pretending to study for my parents.\""
    ],
    weights: [10, 7, 4, 0]
  },
  // Q11 (Standard)
  {
    id: "q11",
    question: "Q11. Reflect on your inner self. Which among these is your \"Single Biggest Barrier\" (The Root Cause)",
    options: [
      "The Collector: I have TBs of lectures/PDFs, but I don't solve questions. ",
      "The Fear: I am scared of getting questions wrong, so I keep re-reading theory. ",
      "The Dopamine Addict: Phone, Social Media, and YouTube Shorts are destroying my day. ",
      "The Mountain: My backlog is so huge I don't know where to start, so I don't start at all. "
    ],
    weights: [0, 0, 0, 0]
  },
  // Q13 -> Opportunity (Primary)
  {
    id: "q13",
    swot: "O",
    impact: "primary",
    question: "Q13. Tell us about your Energy Levels:",
    options: [
      "High Voltage: I feel energetic all day; I exercise/walk specifically to stay fit. ",
      "Afternoon Crash: I start well, but after 2 PM I feel sleepy and lethargic. ",
      "Zombie Mode: I study long hours but feel exhausted and \"foggy\" the whole time. ",
      "Night Owl: I stay awake till 4 AM, but wake up tired and waste the morning. "
    ],
    weights: [10, 6, 3, 4]
  },
  // Q14 -> Opportunity (Secondary)
  {
    id: "q14",
    swot: "O",
    impact: "secondary",
    question: "Q14. How is your health recently?",
    options: [
      "I am fit and take good care of my body ",
      "I fall ill frequently (cold, headaches) ",
      "I have major diseases and treatments going on currently ",
      "My body is physically not fit, but I have started taking care  "
    ],
    weights: [10, 4, 0, 6]
  },
  // Q15 -> Threat (Primary)
  {
    id: "q15",
    swot: "T",
    impact: "primary",
    question: "Q15. How is your Study Environment",
    options: [
      "The Bunker: Private room, silence, zero distractions. ",
      "The Library: I go out to study, which helps, but travel wastes time. ",
      "The Living Room: I study in a noisy area; people keep disturbing me. ",
      "The Chaos: Toxic environment/arguments at home make it hard to concentrate. "
    ],
    weights: [10, 7, 4, 0]
  },
  // Q16 -> Threat (Secondary)
  {
    id: "q16",
    swot: "T",
    impact: "secondary",
    question: "Q16. How exactly are your parents involved in your JEE preparation?",
    options: [
      "The Rock: They are supportive, don't stress much about marks, and ensure I eat/sleep well. ",
      "The Pressure Cooker: They compare me to Sharma ji ka beta and scold me for low marks. ",
      "The Silent: They don't really know what I'm doing; I'm on my own. ",
      "The Manager: They micromanage my schedule (\"Why aren't you studying?\"), which annoys me. "
    ],
    weights: [10, 4, 6, 3]
  },
  // Q17 UPDATED
  {
    id: "q17",
    question: "Q17. Which attempt are you targeting? (Time Horizon)",
    options: [
      "JEE 2027",
      "JEE 2028"
    ],
    weights: [0, 0] 
  },
  // Q18 UPDATED
  {
    id: "q18",
    question: "Q18. In a recent full-length JEE Main–level test, where do you realistically stand?",
    options: [
      "I consistently score 180+ in mocks (or I am confident I can solve 60%+ of the paper today).",
      "I usually score between 120 - 180 (or I can solve roughly half the paper).",
      "I am stuck between 50 - 100 (or I struggle to solve even 20 questions correctly).",
      "I generally can’t score more than 50 marks in JEE Mains Mock Tests."
    ],
    weights: [0, 0, 0, 0] 
  },
  // Q19 NEW: active vs passive study ratio — feeds EI (Consistency & Execution)
  {
    id: "q19",
    question: "Q19. Out of your daily study time, how is your hours distribution split between watching lectures/classes versus solving questions on your own?",
    options: [
      "80% Lectures / 20% Solving",
      "60% Lectures / 40% Solving",
      "50% Lectures / 50% Solving",
      "20% Lectures / 80% Solving"
    ],
    // These are used directly as multipliers in score.js (Q19_MULTIPLIER),
    // not run through the generic 1.0/0.66/0.33/0 index mapping other
    // questions use, since they were given as specific target values.
    weights: [0.3, 0.5, 0.8, 1.0]
  },
  // Q20 NEW: accountability/mentorship signal — display + report-context
  // only, does NOT feed the JSS formula. See AccountabilityCallout on the
  // results page for how this is used.
  {
    id: "q20",
    question: "Q20. Who currently audits your weekly test performance and holds you accountable to your daily targets?",
    options: [
      "Nobody, I analyze them alone (or skip analysis entirely)",
      "My coaching teachers (they care, but rarely have time for 1-on-1 audits)",
      "My parents (they support me, but don't know technical JEE strategy)",
      "A dedicated senior / IITian mentor"
    ],
    weights: [0, 0, 0, 0]
  }
];

// -------------------- SECTION MAP --------------------
// Grouped by ARRAY POSITION (step index), not question id — QUESTIONS has
// q12 listed before q11, so id-based grouping would misorder this section.
const SECTIONS = [
  {
    key: "habits",
    color: "#c62828",
    colorSoft: "#fdeaea",
    title: "Your Study Habits",
    subtitle: "Let's see how consistent you really are.",
    startStep: 1,
    endStep: 2,
  },
  {
    key: "academics",
    color: "#2563eb",
    colorSoft: "#eaf1fe",
    title: "Academic Reality Check",
    subtitle: "Time to be brutally honest about where you stand.",
    startStep: 3,
    endStep: 8,
  },
  {
    key: "mindset",
    color: "#7c3aed",
    colorSoft: "#f1eafe",
    title: "Under the Hood",
    subtitle: "The mental patterns behind your prep.",
    reflection: "Academics: mapped.",
    startStep: 9,
    endStep: 12,
  },
  {
    key: "environment",
    color: "#ea580c",
    colorSoft: "#fef1ea",
    title: "Your Environment & Edge",
    subtitle: "The external factors shaping your prep.",
    reflection: "Your mindset: captured.",
    startStep: 13,
    endStep: 20,
  },
];

const getSectionForStep = (step) =>
  SECTIONS.find((s) => step >= s.startStep && step <= s.endStep) || null;

const getSectionProgress = (section, step) => {
  if (step < section.startStep) return 0;
  if (step > section.endStep) return 1;
  const span = section.endStep - section.startStep + 1;
  const done = step - section.startStep;
  return Math.min(done / span, 1);
};

const MILESTONES = [
  { at: 25, text: () => "Nice, you're a quarter through 🔥" },
  { at: 50, text: (name) => (name ? `Halfway there, ${name} 💪` : "Halfway there, keep going 💪") },
  { at: 75, text: () => "Almost done, final stretch 🚀" },
];

// --- HELPER COMPONENT: (Upgraded with auto-wrapping text) ---
const CircularScore = ({ value, max = 100, color, title, rangeText }) => {
  const radius = 70; 
  const strokeWidth = 12; 
  const size = 180; 
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Premium count-up: the number and the arc fill together, eased, over
  // ~1.4s, instead of just snapping to the final value on mount.
  const numericValue = Number(value) || 0;
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let raf;
    const duration = 2100;
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setAnimatedValue(numericValue * easeOutCubic(progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue]);

  const strokeDashoffset = circumference - (Math.min(animatedValue, max) / max) * circumference;
  const displayValue = Number.isInteger(numericValue) ? Math.round(animatedValue) : animatedValue.toFixed(2);

  // Smart Font Size: Large for "JSS", smaller for "Potential Percentile"
  const titleFontSize = title.length > 5 ? "16px" : "28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      <style>{`
        @keyframes score-glow-pulse {
          0% { filter: drop-shadow(0 0 0px transparent); }
          60% { filter: drop-shadow(0 0 10px ${color}77); }
          100% { filter: drop-shadow(0 0 0px transparent); }
        }
      `}</style>
      <div style={{ width: "180px", height: "180px", position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        
        {/* SVG for the circles */}
        <svg width="180" height="180" viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0 }}>
          {/* Background Circle */}
          <circle cx={center} cy={center} r={radius} stroke="#eee" strokeWidth={strokeWidth} fill="none" />
          
          {/* Progress Circle */}
          <circle
            cx={center} cy={center} r={radius} 
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ animation: "score-glow-pulse 2.3s ease-in-out" }}
          />
        </svg>

        {/* HTML Text Box (Handles Word Wrapping!) */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: "110px" }}>
          <div style={{ 
            fontSize: titleFontSize, 
            fontWeight: "900", 
            color: color, 
            lineHeight: "1.15",
            marginBottom: "4px",
            filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.1))"
          }}>
            {title}
          </div>
          <div style={{ fontSize: "16px", fontWeight: "800", color: "#444" }}>
            {displayValue}
          </div>
        </div>

      </div>
    </div>
  );
};
// --- 1. CLEAN EP CIRCLE (WITH MINIMAL ANIMATION) ---
const CleanEPCircle = ({ value, max = 100, color = "#1db954", title, rangeText }) => {
  const size = 260;
  const center = size / 2;
  const radius = 100; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
      
      {/* MINIMAL CSS ANIMATIONS */}
      <style>{`
        /* Slow, smooth rotation for the outer accent ring */
        @keyframes minimal-spin {
          100% { transform: rotate(360deg); }
        }
        /* Gentle breathing glow for the progress arc */
        @keyframes minimal-pulse {
          0%, 100% { filter: drop-shadow(0px 4px 4px rgba(29, 185, 84, 0.3)); }
          50% { filter: drop-shadow(0px 4px 12px rgba(29, 185, 84, 0.6)); }
        }
      `}</style>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", zIndex: 2 }}>
        <defs>
          <linearGradient id="ep-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe" /> 
            <stop offset="100%" stopColor={color} /> 
          </linearGradient>
        </defs>

        {/* NEW: Minimalist slow-spinning outer dashed ring */}
        <circle 
          cx={center} cy={center} r={radius + 14} 
          stroke="#cbd5e1" strokeWidth="1.5" fill="none" 
          strokeDasharray="4 16" opacity="0.6"
          style={{ transformOrigin: "center", animation: "minimal-spin 35s linear infinite" }} 
        />

        {/* Clean Base Track */}
        <circle cx={center} cy={center} r={radius} stroke="#f1f5f9" strokeWidth="14" fill="none" />

        {/* Main Animated Progress Arc (Now with the breathing glow) */}
        <circle
          cx={center} cy={center} r={radius}
          stroke="url(#ep-gradient)" strokeWidth="14" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ 
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: "minimal-pulse 3s infinite ease-in-out" 
          }}
        />
      </svg>

      {/* Center Text (With the bumped up font size for the numbers!) */}
      <div style={{ position: "absolute", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "160px" }}>
        <span style={{ fontSize: "20px", fontWeight: "900", color: "#0f172a", margin: "0 0 4px 0" }}>
          {title}
        </span>
        <span style={{ fontSize: "23px", fontWeight: "900", color: "#1db954", letterSpacing: "-0.5px" }}>
          {rangeText}
        </span>
      </div>
    </div>
  );
};

// --- 2. GOLDEN PP CIRCLE (ORBIT & SHIMMER - NO CLIPPING) ---
const GoldenPPCircle = ({ value, max = 100, title, rangeText }) => {
  const size = 220; 
  const center = size / 2;
  const radius = 85; 
  const baseStroke = 14; 
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  return (
    <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, display: "flex", justifyContent: "center", alignItems: "center" }}>
      
      {/* Safe, Contained Animations */}
      <style>{`
        @keyframes gold-breathe {
          0% { stroke-width: 14px; filter: drop-shadow(0 0 4px rgba(255, 140, 0, 0.4)); }
          50% { stroke-width: 17px; filter: drop-shadow(0 0 10px rgba(255, 140, 0, 0.8)); }
          100% { stroke-width: 14px; filter: drop-shadow(0 0 4px rgba(255, 140, 0, 0.4)); }
        }
        @keyframes gold-spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* overflow: visible prevents the square clipping! */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: 0, left: 0, overflow: "visible" }}>
        <defs>
           <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#ffd000" />
             <stop offset="100%" stopColor="#ff7b00" />
           </linearGradient>
        </defs>

        {/* Outer Golden Orbit (Tiny rotating dust particles) */}
        <g style={{ transformOrigin: "center", animation: "gold-spin 20s linear infinite" }}>
          <circle cx={center} cy={center} r={radius + 15} stroke="#ffb703" strokeWidth="1.5" fill="none" strokeDasharray="2 12" opacity="0.6" />
        </g>
        
        {/* Inner Golden Orbit (Rotates slowly in reverse) */}
        <g style={{ transformOrigin: "center", animation: "gold-spin 25s linear infinite reverse" }}>
          <circle cx={center} cy={center} r={radius - 14} stroke="#ffb703" strokeWidth="1" fill="none" strokeDasharray="1 15" opacity="0.4" />
        </g>

        {/* Base Track */}
        <circle cx={center} cy={center} r={radius} stroke="#fff8e6" strokeWidth={baseStroke} fill="none" />
        
        {/* Main Breathing Progress Arc */}
        <circle
          cx={center} cy={center} r={radius} 
          stroke="url(#gold-grad)" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ 
            transition: "stroke-dashoffset 1s ease-out",
            animation: "gold-breathe 2.5s infinite ease-in-out" /* Animates thickness and soft glow */
          }}
        />
      </svg>

      {/* Center Text */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "130px" }}>
        <span style={{ fontSize: "18px", fontWeight: "900", color: "#ff8c00", lineHeight: "1.15", marginBottom: "6px" }}>
          {title}
        </span>
        <span style={{ fontSize: "25px", fontWeight: "900", color: "#d97706" }}>
          {rangeText}
        </span>
      </div>
    </div>
  );
};

// --- 3. SECTION MINI-MAP (4 segments showing section progress) ---

// SWOT compass: a tiny 4-quadrant icon in the header that lights up each
// quadrant the moment its underlying primary SWOT question is answered
// (q1=Strength, q3=Weakness, q13=Opportunity, q15=Threat). This is the
// "living preview" — small enough to sit permanently in the header without
// eating mobile screen space, but it visibly assembles as they progress.
const SWOT_QUADRANTS = [
  { key: "S", color: "#10b981", label: "Strength", checkKey: "q1" },
  { key: "W", color: "#f97316", label: "Weakness", checkKey: "q3" },
  { key: "O", color: "#3b82f6", label: "Opportunity", checkKey: "q13" },
  { key: "T", color: "#8b5cf6", label: "Threat", checkKey: "q15" },
];

const SWOT_WEDGE_PATHS = {
  S: "M16,16 L16,2 A14,14 0 0,1 30,16 Z",
  W: "M16,16 L30,16 A14,14 0 0,1 16,30 Z",
  O: "M16,16 L16,30 A14,14 0 0,1 2,16 Z",
  T: "M16,16 L2,16 A14,14 0 0,1 16,2 Z",
};

const SwotCompass = ({ answers }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
    {SWOT_QUADRANTS.map((q) => {
      const filled = answers[q.checkKey] !== undefined;
      return (
        <path
          key={q.key}
          d={SWOT_WEDGE_PATHS[q.key]}
          fill={filled ? q.color : "#e5e7eb"}
          opacity={filled ? 1 : 0.55}
          style={{ transition: "fill 0.4s ease, opacity 0.4s ease" }}
        >
          <title>{q.label} ({filled ? "captured" : "pending"})</title>
        </path>
      );
    })}
    <circle cx="16" cy="16" r="5" fill="#fff" stroke="#d8dde3" strokeWidth="1" />
  </svg>
);

// Small speaker icon used by the sound toggle in the header.
const SoundIcon = ({ enabled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path d="M4 9v6h4l5 5V4L8 9H4z" fill="#777" />
    {enabled ? (
      <path d="M16.2 8.8a5 5 0 010 6.4" stroke="#777" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    ) : (
      <path d="M17 9l4 4m0-4l-4 4" stroke="#777" strokeWidth="1.8" strokeLinecap="round" />
    )}
  </svg>
);

const SectionMiniMap = ({ step }) => (
  <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
    {SECTIONS.map((section, i) => {
      const currentIndex = SECTIONS.findIndex(
        (s) => step >= s.startStep && step <= s.endStep
      );
      const isPast = currentIndex > i || step > section.endStep;
      const fraction = isPast ? 1 : getSectionProgress(section, step);
      return (
        <div
          key={section.key}
          title={section.title}
          style={{
            flex: 1,
            height: "5px",
            borderRadius: "10px",
            background: "#eee",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${fraction * 100}%`,
              background: "#c62828",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      );
    })}
  </div>
);

// --- 4a. ANIMATED SECTION GRAPHICS (replace emojis) ---

// Habit Grid: a small tracker grid that lights up cell-by-cell, like a
// consistency streak filling in — echoes the brand's own "90 Day Habit Grid".
const HabitGridGraphic = ({ color }) => {
  const cells = Array.from({ length: 16 });
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <style>{`
        @keyframes habit-cell-pulse {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
      `}</style>
      {cells.map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        return (
          <rect
            key={i}
            x={10 + col * 26}
            y={10 + row * 26}
            width="18"
            height="18"
            rx="5"
            fill={color}
            style={{
              transformOrigin: `${10 + col * 26 + 9}px ${10 + row * 26 + 9}px`,
              animation: `habit-cell-pulse 2.4s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
    </svg>
  );
};

// Atom: orbiting electrons around a nucleus — Physics/Chem/Math triad.
const AtomGraphic = ({ color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120">
    <circle cx="60" cy="60" r="7" fill={color} />
    {[0, 60, 120].map((deg, i) => (
      <g key={i} transform={`rotate(${deg} 60 60)`}>
        <ellipse
          cx="60"
          cy="60"
          rx="46"
          ry="18"
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.35"
        />
        <circle r="4.5" fill={color}>
          <animateMotion
            dur={`${3 + i * 0.6}s`}
            repeatCount="indefinite"
            path="M 106,60 A 46,18 0 1 1 14,60 A 46,18 0 1 1 106,60"
          />
        </circle>
      </g>
    ))}
  </svg>
);

// Neural pulse: an abstract brain outline with synapses flickering — the
// "mental patterns" section.
const BrainPulseGraphic = ({ color }) => {
  const nodes = [
    [40, 38], [78, 32], [92, 58], [70, 82], [38, 80], [22, 54], [58, 58],
  ];
  const edges = [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [0, 1], [1, 2], [3, 4], [4, 5], [5, 0]];
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <style>{`
        @keyframes synapse-flicker {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
      `}</style>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={color} strokeWidth="1.2" opacity="0.25"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <circle
          key={i}
          cx={x} cy={y} r={i === 6 ? 6 : 4}
          fill={color}
          style={{
            animation: "synapse-flicker 1.8s ease-in-out infinite",
            animationDelay: `${i * 0.22}s`,
          }}
        />
      ))}
    </svg>
  );
};

// Radar sweep: concentric rings with a rotating sweep beam + blips — scanning
// the "external environment" section.
const RadarGraphic = ({ color }) => (
  <svg width="120" height="120" viewBox="0 0 120 120">
    <style>{`
      @keyframes radar-spin { 100% { transform: rotate(360deg); } }
      @keyframes radar-blip {
        0%, 100% { opacity: 0.2; r: 3; }
        50% { opacity: 1; r: 4.5; }
      }
    `}</style>
    {[46, 32, 18].map((r) => (
      <circle key={r} cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="1.3" opacity="0.3" />
    ))}
    <g style={{ transformOrigin: "60px 60px", animation: "radar-spin 3.2s linear infinite" }}>
      <path d="M 60 60 L 60 14 A 46 46 0 0 1 96 38 Z" fill={color} opacity="0.15" />
      <line x1="60" y1="60" x2="60" y2="14" stroke={color} strokeWidth="1.5" opacity="0.6" />
    </g>
    <circle cx="60" cy="60" r="4" fill={color} />
    <circle cx="80" cy="42" r="3" fill={color} style={{ animation: "radar-blip 2s ease-in-out infinite", animationDelay: "0.3s" }} />
    <circle cx="36" cy="76" r="3" fill={color} style={{ animation: "radar-blip 2s ease-in-out infinite", animationDelay: "1s" }} />
  </svg>
);

const SECTION_GRAPHICS = {
  habits: HabitGridGraphic,
  academics: AtomGraphic,
  mindset: BrainPulseGraphic,
  environment: RadarGraphic,
};

// --- 4b. SECTION CHECKPOINT INTERSTITIAL (premium redesign) ---
const SectionIntro = ({ section, sectionNumber, totalSections, onContinue, name }) => {
  const Graphic = SECTION_GRAPHICS[section.key];
  const trimmedName = (name || "").trim();
  const isFirstSection = sectionNumber === 1;
  const subtitleText =
    isFirstSection && trimmedName
      ? `Alright, ${trimmedName}, ${section.subtitle.charAt(0).toLowerCase()}${section.subtitle.slice(1)}`
      : section.subtitle;
  return (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        padding: "48px 20px 40px",
        borderRadius: "20px",
        overflow: "hidden",
        background: `linear-gradient(180deg, ${section.colorSoft} 0%, #ffffff 65%)`,
        border: `1px solid ${section.colorSoft}`,
        animation: "section-intro-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <style>{`
        @keyframes section-intro-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes section-piece-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes graphic-glow-pulse {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.12); }
        }
      `}</style>

      {/* Faint decorative dot-grid background for texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(${section.color}22 1px, transparent 1px)`,
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {section.reflection && (
        <div
          style={{
            position: "relative",
            fontSize: "13px",
            color: "#94a3b8",
            fontStyle: "italic",
            marginBottom: "10px",
            animation: "section-piece-in 0.5s ease 0.02s both",
          }}
        >
          {section.reflection}
        </div>
      )}

      <div
        style={{
          position: "relative",
          display: "inline-block",
          padding: "5px 16px",
          borderRadius: "50px",
          background: "#fff",
          border: `1px solid ${section.colorSoft}`,
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "0.5px",
          color: section.color,
          marginBottom: "22px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        SECTION {sectionNumber} OF {totalSections}
      </div>

      <div
        style={{
          position: "relative",
          width: "140px",
          height: "140px",
          margin: "0 auto 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "section-piece-in 0.6s ease 0.1s both",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${section.color}33 0%, transparent 70%)`,
            animation: "graphic-glow-pulse 2.6s ease-in-out infinite",
          }}
        />
        <Graphic color={section.color} />
      </div>

      <h2
        style={{
          fontSize: "27px",
          fontWeight: "800",
          margin: "0 0 10px 0",
          color: "#111",
          animation: "section-piece-in 0.6s ease 0.18s both",
        }}
      >
        {section.title}
      </h2>
      <p
        style={{
          fontSize: "16px",
          color: "#666",
          maxWidth: "420px",
          margin: "0 auto 32px",
          animation: "section-piece-in 0.6s ease 0.24s both",
        }}
      >
        {subtitleText}
      </p>

      <button
        onClick={onContinue}
        style={{
          position: "relative",
          padding: "14px 42px",
          borderRadius: "12px",
          background: `linear-gradient(135deg, ${section.color}, ${section.color}cc)`,
          color: "white",
          border: "none",
          fontSize: "15px",
          fontWeight: "700",
          cursor: "pointer",
          boxShadow: `0 10px 24px ${section.color}40`,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          animation: "section-piece-in 0.6s ease 0.3s both",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = `0 14px 28px ${section.color}55`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = `0 10px 24px ${section.color}40`;
        }}
      >
        Let's go →
      </button>
    </div>
  );
};

// --- 5. MILESTONE TOAST ---
const MilestoneToast = ({ text }) => (
  <div
    style={{
      position: "fixed",
      top: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      background: "#111",
      color: "white",
      padding: "12px 24px",
      borderRadius: "50px",
      fontSize: "14px",
      fontWeight: "700",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
      animation: "toast-in-out 2.2s ease forwards",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}
  >
    <style>{`
      @keyframes toast-in-out {
        0% { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.95); }
        12% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        85% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.97); }
      }
    `}</style>
    {text}
  </div>
);

// =========================================================
// LIVING REPORT PREVIEW
// A floating report card that visually assembles as the student answers —
// skeleton blocks resolve in a scrambled, abstractly-labeled order (never
// revealing which question maps to which block) while particles arc from
// each answered question toward the card (desktop) or a peek-pill (mobile).
// =========================================================

// --- Minimal inline icon set (matches the grey line-icon style of the
// report card reference) ---
const IconTrendUp = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 17l6-6 4 4 8-8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 7h6v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconBars = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="12" width="3.5" height="8" rx="1" fill={color} />
    <rect x="10.2" y="7" width="3.5" height="13" rx="1" fill={color} />
    <rect x="16.5" y="3" width="3.5" height="17" rx="1" fill={color} />
  </svg>
);
const IconAward = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="5" stroke={color} strokeWidth="2" />
    <path d="M9 12.5L7 21l5-2.5L17 21l-2-8.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPie = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2 A10 10 0 0 1 22 12 L12 12 Z" fill={color} opacity="0.85" />
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);
const IconTarget = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="12" r="1.3" fill={color} />
  </svg>
);
const IconClipboard = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="4" width="14" height="17" rx="2" stroke={color} strokeWidth="2" />
    <rect x="9" y="2" width="6" height="3.5" rx="1" fill={color} />
    <path d="M8 11h8M8 15h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconDocument = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="3" width="14" height="18" rx="2" stroke={color} strokeWidth="2" />
    <path d="M8 8h8M8 12h8M8 16h5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const IconStar = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
const IconQuote = ({ color }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M7 8c-2.2 0-4 1.8-4 4v5h5v-5H6c0-1.1.9-2 2-2V8zm10 0c-2.2 0-4 1.8-4 4v5h5v-5h-2c0-1.1.9-2 2-2V8z" fill={color} />
  </svg>
);

// Small "real chart" placeholders — richer than a plain skeleton bar, used
// for the two dashboard-style blocks in the reference image.
const LineChartMock = ({ color }) => (
  <svg width="100%" height="34" viewBox="0 0 100 34" preserveAspectRatio="none">
    <polyline
      points="2,28 20,22 38,24 56,14 74,16 96,4"
      fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    {[[2,28],[20,22],[38,24],[56,14],[74,16],[96,4]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="2" fill={color} />
    ))}
  </svg>
);
const DonutChartMock = ({ color }) => {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <svg width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r={r} stroke="#eee" strokeWidth="5" fill="none" />
      <circle
        cx="17" cy="17" r={r} stroke={color} strokeWidth="5" fill="none"
        strokeDasharray={c} strokeDashoffset={c * 0.32}
        strokeLinecap="round" transform="rotate(-90 17 17)"
      />
    </svg>
  );
};

// 13 blocks total (12 grid + 1 closing "quote" block), deliberately
// labeled with abstract, non-diagnostic names — none map obviously to a
// specific question, so the student can't reverse-engineer the flow.
const REPORT_BLOCKS = [
  { Icon: IconTrendUp },
  { Icon: IconBars },
  { Icon: IconAward },
  { Icon: IconPie },
  { Icon: IconTarget },
  { Icon: IconTrendUp },
  { Icon: IconClipboard },
  { Icon: IconTarget },
  { Icon: IconDocument },
  { Icon: IconTrendUp, chart: "line" },
  { Icon: IconPie, chart: "donut" },
  { Icon: IconStar },
];

// Which question-step reveals which block, deliberately scrambled so the
// order never matches question order. Steps not listed still fire a
// particle burst (ambient feedback) but resolve nothing — keeps things
// feeling alive without running out of blocks halfway through.
const STEP_BLOCK_MAP = {
  1: 5, 2: 0, 4: 8, 5: 2, 7: 10, 8: 3,
  9: 6, 11: 1, 12: 9, 14: 4, 15: 11, 17: 7,
};
const FINAL_BLOCK_INDEX = 12; // the quote block, reserved for submit

const ReportBlock = ({ block, resolvedColor }) => {
  const isResolved = !!resolvedColor;
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid #f1f1f1",
        borderRadius: "12px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        minHeight: "78px",
        boxShadow: isResolved ? `0 0 0 1px ${resolvedColor}22, 0 6px 14px ${resolvedColor}1f` : "none",
        transition: "box-shadow 0.6s ease",
        "--glow-c": isResolved ? `${resolvedColor}55` : "transparent",
        animation: isResolved ? "block-glow-pulse 0.9s ease" : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <div
          style={{
            width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0,
            background: isResolved ? `${resolvedColor}1c` : "#f2f2f2",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.6s ease",
          }}
        >
          <block.Icon color={isResolved ? resolvedColor : "#c7c7c7"} />
        </div>
        <div
          style={{
            flex: 1, height: "6px", borderRadius: "4px",
            background: isResolved ? `linear-gradient(90deg, ${resolvedColor}38, ${resolvedColor}10)` : "#ececec",
            transition: "background 0.6s ease",
          }}
        />
      </div>

      {block.chart === "line" ? (
        <LineChartMock color={isResolved ? resolvedColor : "#dcdcdc"} />
      ) : block.chart === "donut" ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <DonutChartMock color={isResolved ? resolvedColor : "#dcdcdc"} />
        </div>
      ) : (
        <>
          <div style={{ height: "5px", width: "85%", borderRadius: "3px", background: isResolved ? `${resolvedColor}20` : "#eee", transition: "background 0.6s ease" }} />
          <div style={{ height: "5px", width: "58%", borderRadius: "3px", background: isResolved ? `${resolvedColor}20` : "#eee", transition: "background 0.6s ease" }} />
        </>
      )}
    </div>
  );
};

const QuoteBlock = ({ resolvedColor }) => {
  const isResolved = !!resolvedColor;
  return (
    <div
      style={{
        position: "relative",
        background: "#fff",
        border: "1px solid #f1f1f1",
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        boxShadow: isResolved ? `0 0 0 1px ${resolvedColor}22, 0 6px 14px ${resolvedColor}1f` : "none",
        transition: "box-shadow 0.6s ease",
        "--glow-c": isResolved ? `${resolvedColor}55` : "transparent",
        animation: isResolved ? "block-glow-pulse 0.9s ease" : "none",
      }}
    >
      <div
        style={{
          width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
          background: isResolved ? `${resolvedColor}1c` : "#f2f2f2",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.6s ease",
        }}
      >
        <IconQuote color={isResolved ? resolvedColor : "#d4d4d4"} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ height: "6px", width: "70%", borderRadius: "3px", background: isResolved ? `${resolvedColor}22` : "#eee", transition: "background 0.6s ease" }} />
        <div style={{ height: "6px", width: "92%", borderRadius: "3px", background: isResolved ? `${resolvedColor}22` : "#eee", transition: "background 0.6s ease" }} />
        <div style={{ height: "6px", width: "50%", borderRadius: "3px", background: isResolved ? `${resolvedColor}22` : "#eee", transition: "background 0.6s ease" }} />
      </div>
    </div>
  );
};

// --- The floating report card itself ---
const ReportCard = React.forwardRef(({ name, resolvedBlocks, isPacking, glowColor, blockRefs }, ref) => (
  <div
    ref={ref}
    style={{
      position: "relative",
      width: "100%",
      background: "#fff",
      borderRadius: "22px",
      overflow: "hidden",
      boxShadow: `0 20px 45px -10px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.04)`,
      animation: "report-card-float 5.5s ease-in-out infinite",
      transform: isPacking ? "scale(0.96)" : "scale(1)",
      transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1)",
    }}
  >
    <style>{`
      @keyframes report-card-float {
        0%, 100% { margin-top: 0px; }
        50% { margin-top: -8px; }
      }
      @keyframes pack-shimmer {
        0% { transform: translateX(-120%); }
        100% { transform: translateX(220%); }
      }
      @keyframes pack-ready-in {
        0% { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes block-glow-pulse {
        0% { box-shadow: 0 0 0 0 var(--glow-c), 0 6px 14px var(--glow-c); }
        40% { box-shadow: 0 0 0 6px var(--glow-c), 0 6px 14px var(--glow-c); }
        100% { box-shadow: 0 0 0 0 transparent, 0 6px 14px var(--glow-c); }
      }
    `}</style>

    {/* ambient glow tied to current section color */}
    <div
      style={{
        position: "absolute", inset: "-30%", zIndex: 0, pointerEvents: "none",
        background: `radial-gradient(circle at 30% 20%, ${glowColor}22 0%, transparent 60%)`,
        transition: "background 0.8s ease",
      }}
    />

    {/* decorative curved corner accents, echoing the brand mark */}
    <div style={{ position: "absolute", top: 0, left: 0, width: "60px", height: "60px", background: "radial-gradient(circle at top left, #c62828 0%, transparent 72%)", opacity: 0.14, pointerEvents: "none" }} />
    <div style={{ position: "absolute", bottom: 0, right: 0, width: "70px", height: "70px", background: "radial-gradient(circle at bottom right, #c62828 0%, transparent 72%)", opacity: 0.1, pointerEvents: "none" }} />

    {/* header */}
    <div style={{ position: "relative", padding: "20px 18px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "900", color: "#111", lineHeight: "1.25" }}>
            JEE<span style={{ color: "#999" }}>society</span>
          </div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#888", marginTop: "1px" }}>Report Card</div>
          <div style={{ height: "3px", width: "70px", marginTop: "8px", borderRadius: "2px", background: "linear-gradient(90deg, #c62828, transparent)" }} />
        </div>
        <img
          src="/JEEsociety_logo.png"
          alt="JEEsociety"
          style={{ width: "42px", height: "42px", objectFit: "contain", flexShrink: 0 }}
        />
      </div>
    </div>

    {/* name row */}
    <div style={{ position: "relative", margin: "0 16px 14px", padding: "10px 12px", borderRadius: "13px", background: "#fafafa", border: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: "9px" }}>
      <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#ececec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#999" strokeWidth="2" />
          <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="#999" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: "12px", color: "#666", fontWeight: "600", flexShrink: 0 }}>Name -</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {name ? (
          <div key="filled" style={{ fontSize: "12.5px", fontWeight: "800", color: "#111", animation: "pack-ready-in 0.4s ease", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
        ) : (
          <div style={{ height: "7px", borderRadius: "4px", background: "#e8e8e8", width: "100%" }} />
        )}
      </div>
    </div>

    {/* grid of skeleton blocks */}
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "0 16px 10px" }}>
      {REPORT_BLOCKS.map((block, i) => (
        <div key={i} ref={(el) => { if (blockRefs) blockRefs.current[i] = el; }}>
          <ReportBlock block={block} resolvedColor={resolvedBlocks[i]} />
        </div>
      ))}
    </div>
    <div style={{ position: "relative", padding: "0 16px 18px" }} ref={(el) => { if (blockRefs) blockRefs.current[FINAL_BLOCK_INDEX] = el; }}>
      <QuoteBlock resolvedColor={resolvedBlocks[FINAL_BLOCK_INDEX]} />
    </div>

    {/* packing overlay */}
    {isPacking && (
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 5,
          background: "rgba(255,255,255,0.82)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: "10px", overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute", top: 0, bottom: 0, width: "40%",
            background: "linear-gradient(115deg, transparent, rgba(255,255,255,0.9), transparent)",
            animation: "pack-shimmer 1.1s ease-in-out infinite",
          }}
        />
        <div style={{ fontSize: "30px", animation: "pack-ready-in 0.5s ease" }}>✅</div>
        <div style={{ fontSize: "14px", fontWeight: "800", color: "#111", animation: "pack-ready-in 0.5s ease 0.1s both" }}>
          Your report is ready
        </div>
      </div>
    )}
  </div>
));

// --- Left journey rail (desktop only) — a calm vertical companion to the
// card; only changes state at actual section boundaries, not per-question.
const LeftJourneyRail = ({ step }) => (
  <div style={{ width: "60px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "12px" }}>
    {SECTIONS.map((section, i) => {
      const Graphic = SECTION_GRAPHICS[section.key];
      const reached = step >= section.startStep;
      const isActive = step >= section.startStep && step <= section.endStep;
      const isDone = step > section.endStep;
      return (
        <React.Fragment key={section.key}>
          <div
            title={section.title}
            style={{
              width: "44px", height: "44px", borderRadius: "50%", position: "relative",
              overflow: "hidden", flexShrink: 0,
              background: reached ? section.colorSoft : "#f2f2f2",
              boxShadow: isActive ? `0 0 0 4px ${section.color}22` : "none",
              transition: "background 0.5s ease, box-shadow 0.5s ease",
            }}
          >
            <div style={{ position: "absolute", top: "50%", left: "50%", width: "120px", height: "120px", transform: "translate(-50%, -50%) scale(0.3)" }}>
              <Graphic color={reached ? section.color : "#c7c7c7"} />
            </div>
          </div>
          {i < SECTIONS.length - 1 && (
            <div style={{ width: "2px", height: "46px", background: "#eee", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: isDone ? "100%" : "0%", background: section.color, transition: "height 0.6s ease" }} />
            </div>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// --- Mobile peek-pill (liquid-glass style) ---
const PeekPill = React.forwardRef(({ label, onClick, pulseColor, big, phase }, ref) => {
  // "big" = persistent larger size while on the name step, so it's
  // impossible to miss the moment the report is born.
  // "phase" = transient grow/hold/shrink pulse played when a section
  // finishes, acknowledging the particle's arrival before the next
  // section's checkpoint takes over the screen.
  const basePadding = big ? "16px 30px" : "11px 20px";
  const baseFontSize = big ? "15px" : "13px";
  const baseIconSize = big ? 18 : 15;
  const phaseScale = phase === "growing" || phase === "holding" ? 1.16 : 1;

  return (
    <button
      ref={ref}
      onClick={onClick}
      style={{
        position: "fixed", bottom: "20px", left: "50%",
        transform: `translateX(-50%) scale(${phaseScale})`,
        padding: basePadding, borderRadius: "50px", border: "1px solid rgba(255,255,255,0.6)",
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        boxShadow: pulseColor || phase === "growing" || phase === "holding"
          ? `0 12px 32px ${pulseColor || "#c62828"}55, inset 0 1px 1px rgba(255,255,255,0.7)`
          : "0 10px 24px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.7)",
        display: "flex", alignItems: "center", gap: "8px",
        fontSize: baseFontSize, fontWeight: "700", color: "#333",
        zIndex: 500, cursor: "pointer",
        transition: "box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), padding 0.4s ease, font-size 0.4s ease",
      }}
    >
      <svg width={baseIconSize} height={baseIconSize} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="#c62828" strokeWidth="2" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="#c62828" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  );
});

// --- Particle burst layer: fixed overlay rendering all in-flight particle
// bursts as small glowing dots arcing from the answered question toward
// the report card / peek-pill. ---
const ParticleLayer = ({ bursts }) => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 900 }}>
    <style>{`
      @keyframes particle-fly {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        55% { opacity: 1; }
        100% { transform: translate(var(--endX), var(--endY)) scale(0.25); opacity: 0; }
      }
    `}</style>
    {bursts.map((burst) =>
      Array.from({ length: 6 }).map((_, i) => {
        const dx = burst.ex - burst.sx;
        const dy = burst.ey - burst.sy;
        const jitterX = (Math.random() * 16 - 8);
        return (
          <span
            key={`${burst.id}-${i}`}
            style={{
              position: "fixed",
              left: burst.sx,
              top: burst.sy,
              width: "7px",
              height: "7px",
              marginLeft: "-3.5px",
              marginTop: "-3.5px",
              borderRadius: "50%",
              background: burst.color,
              boxShadow: `0 0 8px ${burst.color}`,
              "--endX": `${dx + jitterX}px`,
              "--endY": `${dy}px`,
              animation: `particle-fly 0.85s cubic-bezier(0.3,0.6,0.4,1) forwards`,
              animationDelay: `${i * 55}ms`,
            }}
          />
        );
      })
    )}
  </div>
);

// =========================================================
// RESULTS PAGE — CONVERSION COMPONENTS
// =========================================================

const IconShield = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const BREAKDOWN_ICONS = {
  consistency_execution: IconTrendUp,
  syllabus_coverage: IconDocument,
  recall_error_control: IconTarget,
  exam_baseline: IconBars,
  environment_stability: IconShield,
};
const BREAKDOWN_COLORS = {
  consistency_execution: "#c62828",
  syllabus_coverage: "#2563eb",
  recall_error_control: "#7c3aed",
  exam_baseline: "#ea580c",
  environment_stability: "#0d9488",
};

// One row of the JSS breakdown — bar fills in on mount (staggered per row)
// so the reveal feels like the score is being "computed" live.
const BreakdownRow = ({ item, delay }) => {
  const [progress, setProgress] = useState(0); // 0 to 1, drives both bar width and earned-number count-up
  const rowRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) return;

    let raf;
    let startTimeout;
    const duration = 2100;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const runAnimation = () => {
      startTimeout = setTimeout(() => {
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          setProgress(easeOutCubic(p));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }, delay);
    };

    // Only starts once the row actually scrolls into view, and only ever
    // fires once (observer disconnects itself immediately after).
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            runAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(startTimeout);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Icon = BREAKDOWN_ICONS[item.key] || IconTarget;
  const color = BREAKDOWN_COLORS[item.key] || "#c62828";
  const width = progress * item.ratio * 100;
  const animatedEarned = (progress * item.earned).toFixed(1);

  return (
    <div ref={rowRef} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px 0", borderBottom: "1px solid #f1f1f1" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
        <div style={{ transform: "scale(1.35)" }}>
          <Icon color={color} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "7px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>{item.label}</span>
          <span style={{ fontSize: "14.5px", color: "#64748b", fontWeight: "700" }}>{animatedEarned}/{item.max}</span>
        </div>
        <div style={{ height: "9px", background: "#f1f1f1", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${width}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: "6px" }} />
        </div>
        <div style={{ fontSize: "14px", color: "#64748b", marginTop: "7px", fontWeight: "500" }}>{item.status}</div>
      </div>
    </div>
  );
};

// Full breakdown card — the 5 rows sum EXACTLY to the JSS shown above it.
const JSSBreakdownCard = ({ breakdown, jss }) => (
  <div style={{ background: "#fff", borderRadius: "20px", padding: "26px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f1f1f1" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Your JSS: Full Breakdown</h3>
    </div>
    <p style={{ margin: "4px 0 6px", fontSize: "15px", color: "#64748b" }}>
      Here's exactly how your <strong>{jss}/100</strong> was calculated. Not a black box.
    </p>
    <div>
      {breakdown.map((item, i) => (
        <BreakdownRow key={item.key} item={item} delay={200 + i * 160} />
      ))}
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "2px solid #f1f1f1" }}>
      <span style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>= Your JSS Score</span>
      <span style={{ fontWeight: "900", fontSize: "20px", color: "#6a11cb" }}>{jss}/100</span>
    </div>
  </div>
);

// Illustrative bell-curve position meter — marker slides in on mount.
const PercentileMeter = ({ percentile, color }) => {
  const [animPct, setAnimPct] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimPct(percentile), 350);
    return () => clearTimeout(t);
  }, [percentile]);
  const markerX = 20 + (animPct / 100) * 360;

  return (
    <div style={{ position: "relative", padding: "40px 10px 10px" }}>
      <style>{`
        @keyframes marker-drop {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <svg width="100%" viewBox="0 0 400 110" style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="pct-fill" x1="0" x2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={color} stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <path d="M20,95 C90,95 130,15 200,15 C270,15 310,95 380,95" fill="none" stroke="#e5e7eb" strokeWidth="2" />
        <path
          d={`M20,95 C90,95 130,15 200,15 C270,15 310,95 380,95 L${markerX},95 L20,95 Z`}
          fill="url(#pct-fill)"
          opacity={animPct > 0 ? 1 : 0}
          style={{ transition: "opacity 0.8s ease" }}
        />
        <line x1={markerX} y1="12" x2={markerX} y2="95" stroke={color} strokeWidth="2" strokeDasharray="4 4" style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }} />
        <circle cx={markerX} cy="15" r="6.5" fill={color} style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div
        style={{
          position: "absolute", left: `${(markerX / 400) * 100}%`, top: "0px", transform: "translateX(-50%)",
          background: color, color: "#fff", padding: "5px 12px", borderRadius: "8px",
          fontSize: "12px", fontWeight: "800", whiteSpace: "nowrap",
          transition: "left 1.1s cubic-bezier(0.16,1,0.3,1)",
          animation: "marker-drop 0.5s ease 0.3s both",
        }}
      >
        You are here
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginTop: "4px", padding: "0 4px", fontWeight: "600" }}>
        <span>Just starting out</span>
        <span>Top-tier ready</span>
      </div>
    </div>
  );
};

const PercentileCard = ({ percentile, jss, color }) => {
  const gap = Math.max(1, Math.round(100 - jss));
  // Deterministic, not random: assumes ~3.2 readiness points closeable per
  // week of focused execution, clamped to a believable 2-20 week range.
  const weeksToClose = Math.min(20, Math.max(2, Math.round(gap / 3.2)));

  return (
    <div style={{ background: "#fff", borderRadius: "20px", padding: "26px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f1f1f1" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "42px", fontWeight: "900", color }}>{Math.round(percentile)}%</span>
        <span style={{ fontSize: "16.5px", color: "#475569", fontWeight: "700" }}>
          of aspirants are behind you right now
        </span>
      </div>
      <p style={{ fontSize: "15px", color: "#64748b", marginTop: "10px", marginBottom: "0", lineHeight: "1.65" }}>
        Most aspirants haven't fixed their execution gaps yet, so you're already ahead of the pack. Top-1%
        IITians are still <strong>{gap} points of readiness</strong> ahead of where you are today, and that gap is
        realistically <strong style={{ color: "#16a34a" }}>closeable in about {weeksToClose} weeks</strong> with
        the right plan.
      </p>
      <PercentileMeter percentile={percentile} color={color} />
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: "7px", marginTop: "14px",
          padding: "7px 14px", borderRadius: "20px", background: "#f8fafc", border: "1px solid #e2e8f0",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600" }}>
          Benchmarked against 5,357 completed assessments
        </span>
      </div>
    </div>
  );
};

// Personalized "what top students do differently" — leads with whichever
// breakdown category the student scored lowest on.
const TOP_STUDENT_TIPS = {
  consistency_execution: "study the same fixed block every single day, even on low-motivation days. Momentum beats mood",
  syllabus_coverage: "finish a first pass of the full syllabus before going deep on any one chapter. Breadth before depth",
  recall_error_control: "review every mock-test mistake within 24 hours, not just right before the next exam",
  exam_baseline: "take a full-length mock every single week, not just before major exams",
  environment_stability: "protect one fixed, distraction-free study zone, even if it's just a corner of a room",
};

const TopStudentsCallout = ({ weakestLabel, weakestKey, color }) => (
  <div style={{ background: `linear-gradient(135deg, ${color}0d, #ffffff)`, border: `1px solid ${color}30`, borderRadius: "20px", padding: "26px 24px" }}>
    <div style={{ fontSize: "12.5px", fontWeight: "800", letterSpacing: "0.5px", color, textTransform: "uppercase", marginBottom: "10px" }}>
      What Top Students Do Differently
    </div>
    <p style={{ fontSize: "16px", color: "#1e293b", lineHeight: "1.65", margin: "0 0 12px" }}>
      Students who score 90+ on <strong>{weakestLabel}</strong>, your current biggest gap, typically{" "}
      {TOP_STUDENT_TIPS[weakestKey] || "build one specific habit and repeat it relentlessly"}.
    </p>
    <p style={{ fontSize: "15px", color: "#475569", margin: 0, fontWeight: "600" }}>
      This score only shows the gap. Your report is where you get the actual{" "}
      <strong style={{ color }}>day-by-day plan</strong> to close it.
    </p>
  </div>
);

// Personalized to their Q20 answer (who audits their weekly performance).
// This is intentionally NOT tied to the JSS formula — it's a separate
// signal used purely to surface a real, honest gap (accountability),
// without naming or pricing any specific mentorship product here.
const ACCOUNTABILITY_COPY = [
  "Right now, nobody is checking whether your plan is actually being executed. That blind spot is exactly where most aspirants quietly fall behind, week after week, without realizing it.",
  "Your teachers care, but with hundreds of students, they can't personally audit your week-to-week execution. That gap between being taught and being held accountable is where preparation quietly slips.",
  "Your parents keep you going, but they can't tell you whether last week's execution actually moved the needle. Emotional support and technical accountability solve two different problems.",
  "You already have someone in your corner keeping you accountable. That's rare, and it's exactly why aspirants with it tend to close their gaps faster than everyone else.",
];

const AccountabilityCallout = ({ answers }) => {
  const idx = Number(answers["q20"]);
  const hasMentor = idx === 3;
  const copy = ACCOUNTABILITY_COPY[idx] !== undefined ? ACCOUNTABILITY_COPY[idx] : ACCOUNTABILITY_COPY[0];
  return (
    <div style={{ background: "#fff", border: "1px solid #f1f1f1", borderRadius: "20px", padding: "26px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#0d948815", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ transform: "scale(1.3)" }}>
            <IconClipboard color="#0d9488" />
          </div>
        </div>
        <div style={{ fontSize: "12.5px", fontWeight: "800", letterSpacing: "0.5px", color: "#0d9488", textTransform: "uppercase" }}>
          Your Accountability Gap
        </div>
      </div>
      <p style={{ fontSize: "16px", color: "#1e293b", lineHeight: "1.65", margin: "0 0 10px" }}>{copy}</p>
      {!hasMentor && (
        <p style={{ fontSize: "14.5px", color: "#64748b", margin: 0 }}>
          Structured, technical accountability is one of the biggest differences between aspirants who
          actually close their gap and those who just keep re-diagnosing it.
        </p>
      )}
    </div>
  );
};

// Founder video — placeholder until a real link is provided. Swap
// FOUNDER_VIDEO_URL to a YouTube embed URL and this renders automatically.
const FOUNDER_VIDEO_URL = null;

const FounderVideoBlock = () => (
  <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", aspectRatio: "16/9", background: "linear-gradient(135deg, #1e293b, #0b0f19)" }}>
    <style>{`
      @keyframes video-pulse {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.08); opacity: 1; }
      }
    `}</style>
    {FOUNDER_VIDEO_URL ? (
      <iframe
        src={FOUNDER_VIDEO_URL}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Founder walkthrough"
      />
    ) : (
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", color: "#fff", textAlign: "center", padding: "20px" }}>
        <div style={{ width: "62px", height: "62px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", animation: "video-pulse 2.2s ease-in-out infinite" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <div style={{ fontWeight: "800", fontSize: "16px" }}>Founder walkthrough coming soon</div>
        <div style={{ fontSize: "14px", opacity: 0.75, maxWidth: "320px" }}>Watch Sreyash break down exactly what your JSS score and report mean.</div>
      </div>
    )}
  </div>
);

// "What's inside your report" — product spec chart. Uses the existing
// /sample-report.pdf as the concrete preview until the real per-student
// sample is provided.
const REPORT_SPEC_ITEMS = [
  { Icon: IconPie, label: "Full JSS Breakdown", desc: "All 5 categories, scored & diagnosed" },
  { Icon: IconTarget, label: "SWOT Deep-Dive", desc: "Strength, Weakness, Opportunity, Threat" },
  { Icon: IconClipboard, label: "14-Day Action Plan", desc: "Specific daily fixes, not generic advice" },
  { Icon: IconTrendUp, label: "Percentile Prediction", desc: "Expected vs potential JEE percentile" },
  { Icon: IconBars, label: "Subject Weak-Zone Map", desc: "Physics / Chemistry / Maths breakdown" },
  { Icon: IconDocument, label: "Printable Materials", desc: "90-day habit grid + mock test tracker" },
];

const ReportSpecChart = () => (
  <div style={{ background: "#fff", borderRadius: "20px", padding: "26px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f1f1f1" }}>
    <h3 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>What's Inside Your Report</h3>
    <p style={{ margin: "4px 0 18px", fontSize: "15px", color: "#64748b" }}>A full PDF, built specifically from your answers.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "18px" }}>
      {REPORT_SPEC_ITEMS.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px", borderRadius: "12px", background: "#fafafa", border: "1px solid #f1f1f1" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#6a11cb15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div style={{ transform: "scale(1.25)" }}>
              <item.Icon color="#6a11cb" />
            </div>
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "14.5px", color: "#1e293b" }}>{item.label}</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
    {/* Intentionally a plain text link, not a button, so it doesn't visually
        compete with the actual "get your report" CTAs on this page. */}
    <div style={{ textAlign: "center" }}>
      <button
        onClick={() => window.open("/sample-report.pdf", "_blank")}
        style={{
          background: "none", border: "none", color: "#6a11cb", fontWeight: "700", fontSize: "14px",
          cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px",
        }}
      >
        See what a finished report looks like →
      </button>
    </div>
  </div>
);

// Testimonials — condensed set for the results page (same voice as the
// landing page's marquee, but a static grid reads more trustworthy here).
const RESULTS_TESTIMONIALS = [
  { name: "Arjun K.", initials: "AK", color: "#a855f7", text: "The report accurately predicted I was wasting time on lectures. The consistency meter was spot on.", tag: "JEE 2027 aspirant" },
  { name: "Priya S.", initials: "PS", color: "#ec4899", text: "Finally a tool that doesn't just give a mock score but tells you WHY you're stuck. This is gold.", tag: "JEE 2028 aspirant" },
  { name: "Rahul V.", initials: "RV", color: "#2563eb", text: "My expected percentile was way below my potential. Now I know exactly what to fix before mains.", tag: "JEE 2027 aspirant" },
  { name: "Ananya R.", initials: "AR", color: "#0d9488", text: "The action plan section alone is worth more than any coaching advice I've received.", tag: "JEE 2028 aspirant" },
];

const TestimonialsGrid = () => (
  <div>
    <h3 style={{ textAlign: "center", fontSize: "23px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
      What Other Aspirants Found
    </h3>
    <p style={{ textAlign: "center", fontSize: "15px", color: "#64748b", marginBottom: "22px" }}>
      From 5,000+ students who've taken this same diagnostic.
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
      {RESULTS_TESTIMONIALS.map((t, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: "16px", padding: "18px", border: "1px solid #f1f1f1", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
            {Array.from({ length: 5 }).map((_, s) => (
              <svg key={s} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2.5l2.9 6 6.6.7-4.9 4.5 1.3 6.5L12 16.9l-5.9 3.3 1.3-6.5-4.9-4.5 6.6-.7z" /></svg>
            ))}
          </div>
          <p style={{ fontSize: "15px", color: "#334155", lineHeight: "1.6", margin: "0 0 12px" }}>"{t.text}"</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                background: t.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12.5px", fontWeight: "800",
              }}
            >
              {t.initials}
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{t.name}</div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>{t.tag}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Reusable primary CTA — used 2-3x down the page with different copy.
// Animated lock icon: the shackle lifts open on hover via a scoped CSS
// rule (the icon just needs to sit inside an element with the
// "jee-lock-trigger" class, e.g. a button, for the hover to apply).
const LockIcon = ({ size = 16, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ overflow: "visible", flexShrink: 0 }}>
    <style>{`
      .jee-lock-trigger:hover .jee-lock-shackle {
        transform: translateY(-3px) rotate(-16deg);
      }
    `}</style>
    <rect x="5" y="11" width="14" height="10" rx="2.5" fill={color} />
    <circle cx="12" cy="15.5" r="1.6" fill="#fff" opacity="0.9" />
    <path
      className="jee-lock-shackle"
      d="M8 11V7a4 4 0 018 0v4"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
      style={{ transformOrigin: "8px 11px", transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
    />
  </svg>
);

const DownloadCTAButton = ({ onClick, isGenerating, label, sublabel }) => (
  <div style={{ textAlign: "center" }}>
    <button
      onClick={onClick}
      disabled={isGenerating}
      className="jee-lock-trigger"
      style={{
        padding: "16px 40px", borderRadius: "14px",
        background: isGenerating ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #7c3aed)",
        color: "white", fontSize: "17px", fontWeight: "800", border: "none",
        cursor: isGenerating ? "not-allowed" : "pointer", transition: "all 0.25s ease",
        boxShadow: isGenerating ? "none" : "0 10px 26px rgba(124, 58, 237, 0.35)",
        display: "inline-flex", alignItems: "center", gap: "10px",
      }}
      onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={(e) => { if (!isGenerating) e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {!isGenerating && <LockIcon size={20} color="#fff" />}
      {isGenerating ? "Generating PDF..." : label}
    </button>
    {sublabel && <div style={{ fontSize: "14px", color: "#94a3b8", marginTop: "10px" }}>{sublabel}</div>}
  </div>
);

export default function StudentSwotForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSWOT, setShowSWOT] = useState(false);
  const [finalSWOT, setFinalSWOT] = useState({ S: "", W: "", O: "", T: "" });
  
  // --- NEW: Replaced email states with a single generating state ---
  const [isGenerating, setIsGenerating] = useState(false);

  // --- SECTIONING + MILESTONE STATE ---
  const [showSectionIntro, setShowSectionIntro] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const shownSectionIntros = useRef(new Set());
  const shownMilestones = useRef(new Set());
  const milestoneTimeoutRef = useRef(null);

  // --- LIVING REPORT PREVIEW STATE ---
  const [resolvedBlocks, setResolvedBlocks] = useState({}); // { blockIndex: colorAtResolutionTime }
  const [isPacking, setIsPacking] = useState(false);
  const [bursts, setBursts] = useState([]); // in-flight particle bursts
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 1100 : false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [pillPulseColor, setPillPulseColor] = useState(null);
  const [pillPhase, setPillPhase] = useState("idle"); // idle | growing | holding | shrinking
  const reportCardRef = useRef(null);
  const peekPillRef = useRef(null);
  const blockRefs = useRef(Array(REPORT_BLOCKS.length + 1).fill(null)); // +1 for the quote block
  const lastOptionPointRef = useRef({ x: typeof window !== "undefined" ? window.innerWidth - 40 : 0, y: typeof window !== "undefined" ? window.innerHeight - 100 : 0 });
  const pillPulseTimeoutRef = useRef(null);
  const mobilePreviewTimeoutRef = useRef(null);
  const sectionAdvanceTimeoutsRef = useRef([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --- SOUND (on by default) — tiny synthesized tones via Web Audio, no
  // audio files needed. A soft tick on option select, a two-note chime on
  // section checkpoints only (kept rare so it still feels like a reward).
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioCtxRef = useRef(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq, duration = 0.12, startOffset = 0, gainPeak = 0.22) => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const now = ctx.currentTime + startOffset;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (e) {
      // Audio isn't critical — fail silently if the browser blocks it.
    }
  };

  const playSelectTick = () => playTone(720, 0.05, 0, 0.2);
  const playSectionChime = () => {
    playTone(523.25, 0.14, 0, 0.22); // C5
    playTone(659.25, 0.16, 0.09, 0.22); // E5
  };

  // --- SELECTION MICRO-FEEDBACK: ripple from tap point + a quick badge
  // pop, layered underneath the existing instant color-swap (unchanged).
  const [ripple, setRipple] = useState(null);
  const [pulseIdx, setPulseIdx] = useState(null);
  const rippleTimeoutRef = useRef(null);
  const pulseTimeoutRef = useRef(null);

  // --- NEW STORY STYLES ---
  const storyTextStyle = {
    fontFamily: "'Pinyon Script', cursive",
    fontSize: "18px",
    color: "#000000",
    textAlign: "center",
    maxWidth: "700px",
    margin: "5px auto",
    lineHeight: "1.5",
    padding: "0 20px",
    textShadow: "0px 1px 1px rgba(0,0,0,0.1)"
  };

  // Progress (exclude name question)
  // Endowed progress effect: start at 8% (not 0%) so the bar never feels
  // like "nothing has happened yet" the moment the form opens.
  const TOTAL_QUESTIONS = 20;
  const BASE_PROGRESS = 8;
  const currentQuestionIndex = Math.max(step - 1, 0); 
  const progressPercent = Math.min(
    Math.round(BASE_PROGRESS + (currentQuestionIndex / TOTAL_QUESTIONS) * (100 - BASE_PROGRESS)),
    100
  );

  const activeSection = getSectionForStep(step);
  const activeSectionIndex = activeSection ? SECTIONS.indexOf(activeSection) : -1;
  const studentName = (answers.name || "").trim();

  // Show a one-time checkpoint interstitial the moment a new section begins.
  useEffect(() => {
    const section = SECTIONS.find((s) => s.startStep === step);
    if (section && !shownSectionIntros.current.has(section.key)) {
      shownSectionIntros.current.add(section.key);
      setShowSectionIntro(section);
      playSectionChime();
      if (isMobile) {
        setShowMobilePreview(true);
        clearTimeout(mobilePreviewTimeoutRef.current);
        mobilePreviewTimeoutRef.current = setTimeout(() => setShowMobilePreview(false), 2400);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Fire a milestone toast the first time progress crosses 25/50/75%.
  useEffect(() => {
    MILESTONES.forEach((m) => {
      if (progressPercent >= m.at && !shownMilestones.current.has(m.at)) {
        shownMilestones.current.add(m.at);
        clearTimeout(milestoneTimeoutRef.current);
        setMilestoneToast(m.text(studentName));
        milestoneTimeoutRef.current = setTimeout(() => setMilestoneToast(null), 2200);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressPercent]);

  const handleChange = (value) => {
    setAnswers({ ...answers, [QUESTIONS[step].id]: value });
  };

  // Wraps handleChange with the ripple + badge-pop micro-feedback and the
  // selection tick sound. Only used for the multiple-choice options.
  const selectOption = (idx, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ idx, x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    clearTimeout(rippleTimeoutRef.current);
    rippleTimeoutRef.current = setTimeout(() => setRipple(null), 550);

    setPulseIdx(idx);
    clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setPulseIdx(null), 380);

    // Remember where on screen this option sat — this is the particle
    // burst's launch point once "Next"/"Submit" is clicked.
    lastOptionPointRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    handleChange(idx);
    playSelectTick();
  };

  // Fires a particle burst from the last-selected option toward the report
  // card (desktop) or peek-pill (mobile), and resolves a skeleton block
  // ~700ms later (roughly when the particles land) if this step maps to one.
  const fireBurst = (currentStep, blockIdxOverride) => {
    const section = getSectionForStep(currentStep);
    const color = section ? section.color : "#c62828";
    const { x: sx, y: sy } = lastOptionPointRef.current;
    const blockIdx = blockIdxOverride !== undefined ? blockIdxOverride : STEP_BLOCK_MAP[currentStep];

    // On desktop, aim for the exact block that's about to resolve (so the
    // particles visibly land on the box that will glow), not just the
    // card's overall center. Falls back to the card/pill center when this
    // step doesn't resolve a block, or on mobile where blocks aren't
    // individually visible.
    let targetEl = null;
    if (!isMobile && blockIdx !== undefined && blockRefs.current[blockIdx]) {
      targetEl = blockRefs.current[blockIdx];
    } else {
      targetEl = (isMobile ? peekPillRef : reportCardRef).current;
    }
    const targetRect = targetEl ? targetEl.getBoundingClientRect() : null;
    const ex = targetRect ? targetRect.left + targetRect.width / 2 : sx;
    const ey = targetRect ? targetRect.top + targetRect.height / 2 : sy;
    const burstId = `${currentStep}-${Date.now()}-${Math.random()}`;

    setBursts((prev) => [...prev, { id: burstId, sx, sy, ex, ey, color }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== burstId)), 950);

    if (blockIdx !== undefined) {
      setTimeout(() => {
        setResolvedBlocks((prev) => ({ ...prev, [blockIdx]: color }));
      }, 700);
    }

    if (isMobile) {
      setPillPulseColor(color);
      clearTimeout(pillPulseTimeoutRef.current);
      pillPulseTimeoutRef.current = setTimeout(() => setPillPulseColor(null), 700);
    }

    return color;
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
  };

  // Wraps next() with the particle burst — skipped on step 0 (name), since
  // the name already mirrors live into the card header as they type it.
  //
  // When the upcoming step is the START of a new section, we deliberately
  // slow down: let the particle land, let the pill (mobile) grow to
  // acknowledge it and fade back down, THEN advance — instead of the
  // section checkpoint slamming in on top of a still-flying particle.
  const handleNextClick = () => {
    const currentStep = step;
    const nextStep = currentStep + 1;
    const enteringNewSection = currentStep > 0 && SECTIONS.some((s) => s.startStep === nextStep);

    if (currentStep > 0) fireBurst(currentStep);

    // Clear any previous pending section-advance timers (guards against
    // rapid double-clicks stacking up multiple delayed transitions).
    sectionAdvanceTimeoutsRef.current.forEach(clearTimeout);
    sectionAdvanceTimeoutsRef.current = [];

    if (!enteringNewSection) {
      next();
      return;
    }

    if (isMobile) {
      const t1 = setTimeout(() => setPillPhase("growing"), 700);
      const t2 = setTimeout(() => setPillPhase("holding"), 700 + 380);
      const t3 = setTimeout(() => setPillPhase("shrinking"), 700 + 380 + 320);
      const t4 = setTimeout(() => {
        setPillPhase("idle");
        next();
      }, 700 + 380 + 320 + 380);
      sectionAdvanceTimeoutsRef.current = [t1, t2, t3, t4];
    } else {
      // Desktop has no pill to grow, but still give the particle + block
      // glow time to land before swapping in the section checkpoint.
      const t1 = setTimeout(() => next(), 1100);
      sectionAdvanceTimeoutsRef.current = [t1];
    }
  };

  const calculateSWOT = () => {
    const sIndex = Number(answers["q1"] || 0);
    const wIndex = Number(answers["q3"] || 0);
    const oIndex = Number(answers["q13"] || 0);
    const tIndex = Number(answers["q15"] || 0);

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const getResponse = (lib, idx) => {
      const bucket = lib && lib[idx] ? lib[idx] : (lib ? lib[0] : ["Data missing"]);
      return pick(bucket);
    };

    setFinalSWOT({
      S: getResponse(StrengthResponses, sIndex),
      W: getResponse(WeaknessResponses, wIndex),
      O: getResponse(OpportunityResponses, oIndex),
      T: getResponse(ThreatResponses, tIndex),
    });

    setShowSWOT(true);
  };

  // Final submit: fires the last particle burst (resolving the closing
  // "quote" block), then plays the card's packing-up animation, THEN
  // transitions to the real results page once that's had time to land.
  const handleFinalSubmit = () => {
    fireBurst(step, FINAL_BLOCK_INDEX);
    setTimeout(() => {
      setIsPacking(true);
      playSectionChime();
      if (isMobile) setShowMobilePreview(true);
    }, 950);
    setTimeout(() => {
      calculateSWOT();
    }, 950 + 1500);
  };

  // (submit() removed — handleFinalSubmit now drives the final transition,
  // pairing the report-card packing animation with calculateSWOT().)

  // --------------------------------------------------------
  // HANDLE DIRECT PDF DOWNLOAD (Student Workflow)
  // --------------------------------------------------------
  const handleDownloadReport = async () => {
    setIsGenerating(true);

    const result = computeScores(answers);
    const { 
      jee_society_score, 
      expected_percentile_range, 
      potential_percentile_range 
    } = result;

    const q17Obj = QUESTIONS.find(q => q.id === "q17");
    const attemptIndex = answers["q17"];
    const attemptLabel = (q17Obj && q17Obj.options[attemptIndex]) ? q17Obj.options[attemptIndex] : "2028"; 

    const safeExpected = expected_percentile_range || [0, 0];
    const safePotential = potential_percentile_range || [0, 0];

    const optionMap = ["A", "B", "C", "D"];
    const generatedManifestKeys = {};

    Object.keys(answers).forEach((key) => {
      if (key.startsWith("q")) {
        const answerIndex = Number(answers[key]);
        if (!isNaN(answerIndex) && optionMap[answerIndex]) {
          generatedManifestKeys[key] = `${key.toUpperCase()}_${optionMap[answerIndex]}`;
        }
      }
    });

    // Prepare payload (No email field needed anymore)
    const reportPayload = {
      name: answers["name"] || "Future IITian",
      answers: answers,
      jee_society_score: jee_society_score,
      target_attempt: attemptLabel,
      expected_percentile: safeExpected,
      potential_percentile: safePotential,
      swot: {
        strengths: finalSWOT.S,
        weaknesses: finalSWOT.W,
        opportunities: finalSWOT.O,
        threats: finalSWOT.T
      },
      recommendations: "Focus on your flagged weaknesses. Use the Opportunity areas to gain extra marks.",
      manifestKeys: generatedManifestKeys
    };

    try {
      const response = await fetch("https://backend-final-510329279046.asia-south1.run.app/send-dynamic-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportPayload) 
      });
      
      if (!response.ok) {
        throw new Error("Server failed to generate the PDF.");
      }

      // Convert the raw response into a file blob
      const blob = await response.blob();
      
      // Create a temporary link and trigger the browser download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const studentName = (answers["name"] || "Student").replace(/\s+/g, '_');
      link.setAttribute("download", `JEEsociety_Report_${studentName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Error generating report. Make sure the backend is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------- RENDER: RESULTS PAGE (STUDENT-FACING, CONVERSION-OPTIMIZED) ----------------
  if (showSWOT) {
    const scores = computeScores(answers);
    const { jee_society_score } = scores;

    const attemptIndex = answers["q17"];
    const attemptLabel = QUESTIONS.find(q => q.id === "q17").options[attemptIndex] || "JEE Main";

    // Whichever of the 5 breakdown categories they scored lowest on
    // (as a ratio, not raw points, so categories with different maxes
    // are compared fairly) — drives the personalized "top students" tip.
    const weakestCategory = scores.breakdown.reduce(
      (worst, item) => (item.ratio < worst.ratio ? item : worst),
      scores.breakdown[0]
    );

    const rowStyle = {
      display: "flex", flexWrap: "wrap", alignItems: "center",
      justifyContent: "center", gap: "30px", marginBottom: "40px", textAlign: "left"
    };

    const boxStyle = (color, bg) => ({
      flex: "1 1 300px", minWidth: "280px", background: bg,
      padding: "20px", borderRadius: "12px", borderLeft: `6px solid ${color}`,
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    });

    return (
      <div className="swot-container" style={{ maxWidth: "760px", margin: "0 auto", fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        {/* --- Breadcrumb / personalized greeting (kept) --- */}
        {studentName && (
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "6px" }}>
            Great work, <strong>{studentName}</strong>. Here's your full breakdown.
          </p>
        )}
        <h2 style={{ marginBottom: "10px", fontSize: "28px" }}>Your Performance Summary</h2>

        <div style={{ marginBottom: "34px", color: "#666", fontSize: "18px", background: "#f1f1f1", display: "inline-block", padding: "8px 20px", borderRadius: "20px" }}>
          Target: <strong>{attemptLabel}</strong>
        </div>

        {/* --- 1. BIG JSS SCORE REVEAL --- */}
        <div style={{ ...rowStyle, gap: "35px", marginTop: "10px", marginBottom: "14px" }}>
           <div style={{ flex: "0 0 auto", transform: "scale(1.12)", transformOrigin: "center", zIndex: 1 }}>
              <CircularScore value={jee_society_score} color="#6a11cb" title="JSS" rangeText={jee_society_score} />
           </div>

           <div style={{
             ...boxStyle("#6a11cb", "#f8f9fa"),
             padding: "22px 25px",
             borderLeft: "7px solid #6a11cb"
           }}>
             <h3 style={{ margin: "0 0 8px 0", color: "#6a11cb", fontSize: "22px" }}>JSS (JEEsociety Score)</h3>
             <p style={{ margin: 0, fontSize: "15.5px", color: "#333", lineHeight: "1.65" }}>
               This is your <b>Holistic Preparation Index</b>. Unlike a mock test that only checks knowledge, JSS accounts for your Consistency, Focus, Revision Quality, and Syllabus Coverage.
             </p>
           </div>
        </div>

        {/* Our strongest trust signal, pulled up here so nobody has to
            scroll to find it. */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "7px 14px", borderRadius: "20px", background: "#f8fafc", border: "1px solid #e2e8f0",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: "12.5px", color: "#64748b", fontWeight: "600" }}>
              Scored using the same model already trusted by 5,357 JEE aspirants
            </span>
          </div>
        </div>

        {/* --- FRAMING BANNER: this page is the preview, the report is the real deliverable --- */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "14px",
          padding: "14px 18px", marginBottom: "30px",
        }}>
          <LockIcon size={26} color="#9a3412" />
          <p style={{ margin: 0, fontSize: "14.5px", color: "#9a3412", fontWeight: "600", lineHeight: "1.55" }}>
            This score is your free instant snapshot. The full diagnosis, your complete SWOT, and your
            personalized day-by-day action plan only exist inside your report.
          </p>
        </div>

        {/* --- 2. DETAILED JSS BREAKDOWN (sums exactly to the score above) --- */}
        <div style={{ marginBottom: "26px" }}>
          <JSSBreakdownCard breakdown={scores.breakdown} jss={jee_society_score} />
        </div>

        {/* --- 3. PERCENTILE VS ASPIRANTS --- */}
        <div style={{ marginBottom: "30px" }}>
          <PercentileCard percentile={scores.percentile_vs_aspirants} jss={jee_society_score} color="#c62828" />
        </div>

        {/* --- DOWNLOAD CTA #1 --- */}
        <div style={{ marginBottom: "44px" }}>
          <DownloadCTAButton
            onClick={handleDownloadReport}
            isGenerating={isGenerating}
            label="Unlock My Full Report"
            sublabel="See your complete SWOT, action plan & percentile prediction"
          />
        </div>

        {/* --- 4. WHAT TOP STUDENTS DO DIFFERENTLY (personalized to weakest category) --- */}
        <div style={{ marginBottom: "26px" }}>
          <TopStudentsCallout
            weakestLabel={weakestCategory.label}
            weakestKey={weakestCategory.key}
            color={BREAKDOWN_COLORS[weakestCategory.key] || "#c62828"}
          />
        </div>

        {/* --- 4b. ACCOUNTABILITY GAP (personalized to Q20, subtle mentorship-need primer) --- */}
        <div style={{ marginBottom: "40px" }}>
          <AccountabilityCallout answers={answers} />
        </div>

        {/* --- 5. SWOT SECTION (kept) --- */}
        <h2 style={{ marginTop: "10px" }}>Your Strength & Weakness</h2>
        <div className="swot-box strength"><b>Strength:</b> {finalSWOT.S}</div>
        <div className="swot-box weakness"><b>Weakness:</b> {finalSWOT.W}</div>

        {/* --- 6. FOUNDER VIDEO --- */}
        <div style={{ marginTop: "44px", marginBottom: "40px" }}>
          <h3 style={{ textAlign: "center", fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
            Hear It Straight From The Founder
          </h3>
          {/* Placeholder badge: I don't have the actual IIT Bombay crest file,
              so this uses an <img> pointing at /iit-bombay-logo.png with a
              text fallback. Drop the real logo file into /public with that
              exact filename and it'll appear automatically. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "18px" }}>
            <img
              src="/iit-bombay-logo.png"
              alt="IIT Bombay"
              style={{ height: "22px", width: "22px", objectFit: "contain" }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
            <span style={{ fontSize: "13.5px", fontWeight: "700", color: "#64748b" }}>IIT Bombay Alumnus</span>
          </div>
          <FounderVideoBlock />
        </div>

        {/* --- 7. PRODUCT SPEC CHART (what's inside your report) --- */}
        <div style={{ marginBottom: "56px" }}>
          <ReportSpecChart />
        </div>

        {/* --- DOWNLOAD CTA #2 --- */}
        <div style={{ marginBottom: "46px" }}>
          <DownloadCTAButton
            onClick={handleDownloadReport}
            isGenerating={isGenerating}
            label="Get Your Report Now"
            sublabel="Ready in seconds. Don't lose this insight."
          />
        </div>

        {/* --- 8. TESTIMONIALS --- */}
        <div style={{ marginBottom: "44px" }}>
          <TestimonialsGrid />
        </div>

        {/* --- DOWNLOAD CTA #3 (final close) --- */}
        <div style={{
          background: "linear-gradient(135deg, #0b0f19, #1e1330)",
          borderRadius: "20px", padding: "34px 24px", textAlign: "center", marginBottom: "40px",
        }}>
          <div style={{ fontSize: "21px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>
            Don't waste another week guessing.
          </div>
          <div style={{ fontSize: "15px", color: "#94a3b8", marginBottom: "22px" }}>
            Your personalized report, built entirely from your own answers, is ready right now.
          </div>
          <DownloadCTAButton
            onClick={handleDownloadReport}
            isGenerating={isGenerating}
            label="Claim My Report Now"
          />
        </div>

        {/* --- YOUTUBE BUTTON (kept) --- */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}>
          <a
            href="https://www.youtube.com/@SreyashBhaiyaIITB"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 28px", borderRadius: "50px",
                background: "#FF0000", color: "white",
                fontSize: "16px", fontWeight: "700", border: "none",
                cursor: "pointer", boxShadow: "0 4px 15px rgba(255, 0, 0, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(255, 0, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(255, 0, 0, 0.3)";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              The JEEsociety YouTube
            </button>
          </a>
        </div>

        {/* --- GO BACK / START NEW ASSESSMENT (kept) --- */}
        <div style={{ marginTop: "40px", textAlign: "center", paddingBottom: "20px" }}>
          <button
            onClick={() => {
              setStep(0);
              setAnswers({});
              setShowSWOT(false);
            }}
            style={{
              background: "transparent", border: "2px solid #e0e0e0",
              padding: "10px 25px", borderRadius: "50px", color: "#666",
              fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "#c62828";
              e.target.style.color = "#c62828";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "#e0e0e0";
              e.target.style.color = "#666";
            }}
          >
            + Start New Assessment
          </button>
        </div>
      </div>
    );
  }

  // -------------------- QUESTION PAGE --------------------
  const q = QUESTIONS[step];

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", padding: "20px 12px" }}>
      <Helmet>
        <title>Start Assessment | JEE Society</title>
        <meta name="description" content="Answer 20 questions to analyze your JEE Main & Advanced consistency, focus, and syllabus coverage." />
        <link rel="canonical" href="https://report.jeesociety.in/assessment" />
        <meta name="robots" content="noindex" /> {/* Optional: Keep Google away from the quiz questions directly? Usually yes. */}
      </Helmet>

      {milestoneToast && <MilestoneToast text={milestoneToast} />}

      <ParticleLayer bursts={bursts} />

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: "20px",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        {!isMobile && <LeftJourneyRail step={step} />}

        <div style={{ maxWidth: "720px", width: "100%", flex: "1 1 720px" }}>
        <div style={{
          background: "#fff", padding: "28px", borderRadius: "18px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)"
        }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" fill="#c62828" />
                <path d="M5 13v4c0 1.66 3.58 3 7 3s7-1.34 7-3v-4" fill="#c62828" opacity="0.85" />
              </svg>
              <div className="brand">JEE<span className="brand-light">society</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setSoundEnabled((v) => !v)}
                title={soundEnabled ? "Mute sound" : "Enable sound"}
                aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "2px" }}
              >
                <SoundIcon enabled={soundEnabled} />
              </button>
              {step > 0 && <SwotCompass answers={answers} />}
              <div style={{ fontSize: "14px", color: "#999" }}>{progressPercent}% Complete</div>
            </div>
          </div>

          {/* Section mini-map (4 segments) — only shown once past the name step */}
          {step > 0 && <SectionMiniMap step={step} />}

          {showSectionIntro ? (
            <SectionIntro
              section={showSectionIntro}
              sectionNumber={activeSectionIndex + 1}
              totalSections={SECTIONS.length}
              onContinue={() => setShowSectionIntro(null)}
              name={studentName}
            />
          ) : (
            <>
              {/* Question label (progress itself is shown by the section mini-map above + the % in the header) */}
              <div style={{ fontSize: "14px", color: "#777", marginBottom: "20px" }}>
                {activeSection ? `${activeSection.title} · ` : ""}
                Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
              </div>

              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "20px" }}>{q.question}</h2>

              {/* INPUTS */}
              {q.type === "text" ? (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleChange(e.target.value)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box"
                  }}
                  placeholder="Type your answer..."
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <style>{`
                    @keyframes option-ripple {
                      0% { transform: scale(0); opacity: 0.5; }
                      100% { transform: scale(22); opacity: 0; }
                    }
                    @keyframes badge-pop {
                      0% { transform: scale(1); }
                      45% { transform: scale(1.18); }
                      100% { transform: scale(1); }
                    }
                  `}</style>
                  {q.options.map((opt, idx) => {
                    const isSelected = answers[q.id] == idx;
                    return (
                      <div
                        key={idx}
                        onClick={(e) => selectOption(idx, e)}
                        style={{
                          position: "relative", overflow: "hidden",
                          display: "flex", alignItems: "center", gap: "14px",
                          padding: "18px 20px", borderRadius: "14px", cursor: "pointer",
                          border: isSelected ? "2px solid #c62828" : "1px solid #e0e0e0",
                          background: isSelected ? "#c62828" : "#fff",
                          color: isSelected ? "white" : "#000",
                          transition: "all 0.25s ease"
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#f8eaea"; }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#fff"; }}
                      >
                        {ripple && ripple.idx === idx && (
                          <span
                            key={ripple.id}
                            style={{
                              position: "absolute",
                              left: ripple.x,
                              top: ripple.y,
                              width: "10px",
                              height: "10px",
                              marginLeft: "-5px",
                              marginTop: "-5px",
                              borderRadius: "50%",
                              background: isSelected ? "rgba(255,255,255,0.5)" : "rgba(198,40,40,0.3)",
                              pointerEvents: "none",
                              animation: "option-ripple 0.5s ease-out forwards",
                            }}
                          />
                        )}
                        <div style={{
                          position: "relative",
                          minWidth: "24px", minHeight: "24px", width: "24px", height: "24px",
                          flexShrink: 0, borderRadius: "50%",
                          border: `2px solid ${isSelected ? "white" : "#bbb"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: "900", fontSize: "14px", fontFamily: "Arial", lineHeight: "1",
                          animation: pulseIdx === idx ? "badge-pop 0.35s ease" : "none",
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div style={{ position: "relative", fontSize: "16px", lineHeight: "1.45" }}>{opt}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ✅ ADDED: Disclaimer Text (Task 1) */}
              {q.id !== "name" && (
                <p style={{ fontSize: "12px", color: "#888", marginTop: "15px", textAlign: "center", fontStyle: "italic" }}>
                  If more than one  option feels 100% correct, choose the closest one - the model is designed to adjust for that.
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "35px", gap: "16px" }}>
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#fff", border: "1px solid #ddd", cursor: "pointer", fontSize: "15px" }}
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={step === QUESTIONS.length - 1 ? handleFinalSubmit : handleNextClick}
                  disabled={answers[q.id] === undefined}
                  style={{
                    flex: 1, padding: "14px", borderRadius: "12px", background: "#c62828",
                    color: "white", border: "none", cursor: "pointer", fontSize: "15px",
                    opacity: answers[q.id] === undefined ? 0.5 : 1
                  }}
                >
                  {step === QUESTIONS.length - 1 ? "Submit" : "Next →"}
                </button>
              </div>
            </>
          )}

        </div>
        </div>

        {!isMobile && (
          <div style={{ width: "300px", flexShrink: 0, position: "sticky", top: "20px" }}>
            <ReportCard
              ref={reportCardRef}
              name={(answers.name || "").trim()}
              resolvedBlocks={resolvedBlocks}
              isPacking={isPacking}
              glowColor={(activeSection && activeSection.color) || "#c62828"}
              blockRefs={blockRefs}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <PeekPill
          ref={peekPillRef}
          label={
            step === 0
              ? "Tap to preview"
              : `Your report · ${Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)}/${TOTAL_QUESTIONS}`
          }
          big={step === 0}
          phase={pillPhase}
          onClick={() => setShowMobilePreview((v) => !v)}
          pulseColor={pillPulseColor}
        />
      )}

      {isMobile && showMobilePreview && (
        <div
          onClick={() => setShowMobilePreview(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
            zIndex: 600, display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <style>{`
            @keyframes sheet-slide-up {
              0% { opacity: 0; transform: translateY(30px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "420px", maxHeight: "82vh", overflowY: "auto",
              padding: "16px", animation: "sheet-slide-up 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <ReportCard
              name={(answers.name || "").trim()}
              resolvedBlocks={resolvedBlocks}
              isPacking={isPacking}
              glowColor={(activeSection && activeSection.color) || "#c62828"}
              blockRefs={blockRefs}
            />
          </div>
        </div>
      )}
    </div>
  );
}