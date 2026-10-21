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

// -------------------- QUESTIONS DATA (16 HIGH-IMPACT QUESTIONS) --------------------
const QUESTIONS = [
  {
    id: "name",
    type: "text",
    question: "What is your name?"
  },
  // 1 -> q1 (Strength Primary)
  {
    id: "q1",
    swot: "S",
    impact: "primary",
    question: "Q1. How consistent is your daily JEE study routine?",
    options: [
      "The Machine: I study every single day without fail, hitting all my targets.",
      "The Weekend Warrior: I have 3-4 good days, but I waste 2-3 days feeling unmotivated.",
      "The Burst Worker: I study 14 hours one day, then burnout and do nothing for 2 days.",
      "The Procrastinator: I plan every night, but barely execute 20% of it the next day."
    ],
    weights: [10, 6, 4, 0]
  },
  // 2 -> q2 (Strength Secondary)
  {
    id: "q2",
    swot: "S",
    impact: "secondary",
    question: "Q2. Which best describes your actual self-study routine on a typical day?",
    options: [
      "Deep Focus: 6+ hours of pure, phone-free study (excluding lectures).",
      "Standard Grind: 4-6 hours of self-study, but I take frequent breaks.",
      "Passive Consumption: I spend most of my time watching lectures/One-shots; barely 2 hours of solving.",
      "Distracted: I sit for 10 hours, but effective study is hardly 2 hours due to phone/daydreaming."
    ],
    weights: [10, 7, 3, 0]
  },
  // 3 -> q3 (Weakness Primary)
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
  // 4 -> q4 (Physics)
  {
    id: "q4",
    swot: "W",
    impact: "secondary",
    question: "Q4. How is your Physics (Honestly)?",
    options: [
      "Strong: I can solve JEE Mains PYQs accurately under timed practice now.",
      "Average: I understand concepts but get stuck on tricky questions; I am giving it high priority.",
      "Weak: I struggle with basics; I am ignoring them to focus on Chemistry/Math.",
      "Comfort Trap: Physics is my strongest subject, yet I still spend 50%+ of my time watching videos on Physics because I like it."
    ],
    weights: [10, 7, 3, 0]
  },
  // 5 -> q5 (Chemistry)
  {
    id: "q5",
    question: "Q5. How is your Chemistry (Honestly)?",
    options: [
      "Strong: NCERT is on my tips; I score high consistently.",
      "Volatile: I memorize it, but forget it in 3 days; I spend time re-reading notes constantly.",
      "Weak: I hate Chemistry; I barely touch this subject.",
      "Average: I am good at any one part (OC/IOC/PC), and bad at another."
    ],
    weights: [10, 6, 2, 4]
  },
  // 6 -> q6 (Maths)
  {
    id: "q6",
    question: "Q6. How is your Mathematics (Honestly)?",
    options: [
      "Killer: I love Math; I love solving complex problems in a given time.",
      "Survivor: I only target specific high-weightage chapters (Vector/3D) to clear cutoff.",
      "Phobia: I am terrified of Math; I haven't solved a question in weeks.",
      "The Ego Lifter: I am weak, but I waste hours trying to solve impossible problems just to prove I can."
    ],
    weights: [10, 7, 2, 3]
  },
  // 7 -> q7 (Recall)
  {
    id: "q7",
    question: "Q7. How is your Recall Strength in an exam setting?",
    options: [
      "Crystal Clear: I recall every formula while solving questions.",
      "Blurry: I recognize the concept when I see the solution, but can't recall it during the question.",
      "Leaky Bucket: I study a chapter, but 1 week later it feels like I never studied it.",
      "Blank Out: I panic in tests and forget even the basics I knew well."
    ],
    weights: [10, 7, 4, 0]
  },
  // 8 -> q8 (Solving Speed)
  {
    id: "q8",
    question: "Q8. When you sit down to solve JEE Mains PYQs for 1 hour, what realistically happens?",
    options: [
      "I solve 20+ MCQs per hour with high accuracy.",
      "I solve 10-15 MCQs per hour.",
      "I take 10 minutes per question (mostly staring at it).",
      "I don’t like solving questions at all."
    ],
    weights: [10, 7, 3, 0]
  },
  // 9 -> q9 (Attention Span - Kept so Mindset section has 3 solid questions)
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
  // 10 -> q10 (Mock Test Mistake Patterns)
  {
    id: "q10",
    question: "Q10. When you analyze your mock test mistakes, where do most of your lost marks go?",
    multi: true,
    maxSelect: 3,
    options: [
      "Conceptual: I honestly didn't know the theory/logic.",
      "Silly/Calculation: I knew it, but made a silly mistake or read the question wrong.",
      "Ego/Time: I got stuck on one hard question and wasted 10 minutes, ruining the paper.",
      "Fear/Skipping: I skipped easy questions because the chapter \"looked\" scary."
    ],
    weights: [0, 0, 0, 0]
  },
  // 11 -> q11 (Core Root Cause Barriers)
  {
    id: "q11",
    question: "Q11. Reflect on your inner self. What are your biggest barriers right now?",
    multi: true,
    maxSelect: 2,
    options: [
      "The Collector: I have TBs of lectures/PDFs, but I don't solve questions.",
      "The Fear: I am scared of getting questions wrong, so I keep re-reading theory.",
      "The Dopamine Addict: Phone, Social Media, and YouTube Shorts are destroying my day.",
      "The Mountain: My backlog is so huge I don't know where to start, so I don't start at all."
    ],
    weights: [0, 0, 0, 0]
  },
  // 12 -> q13 (Energy Levels - Displayed as Q12)
  {
    id: "q13",
    swot: "O",
    impact: "primary",
    question: "Q12. Tell us about your Daily Energy Levels:",
    multi: true,
    maxSelect: 2,
    options: [
      "High Voltage: I feel energetic all day; I exercise/walk specifically to stay fit.",
      "Afternoon Crash: I start well, but after 2 PM I feel sleepy and lethargic.",
      "Zombie Mode: I study long hours but feel exhausted and \"foggy\" the whole time.",
      "Night Owl: I stay awake till 4 AM, but wake up tired and waste the morning."
    ],
    weights: [10, 6, 3, 4]
  },
  // 13 -> q15 (Study Environment - Displayed as Q13)
  {
    id: "q15",
    swot: "T",
    impact: "primary",
    question: "Q13. How is your Study Environment?",
    multi: true,
    maxSelect: 2,
    options: [
      "The Bunker: Private room, silence, zero distractions.",
      "The Library: I go out to study, which helps, but travel wastes time.",
      "The Living Room: I study in a noisy area; people keep disturbing me.",
      "The Chaos: Toxic environment/arguments at home make it hard to concentrate."
    ],
    weights: [10, 7, 4, 0]
  },
  // 14 -> q17 (Target Attempt - Displayed as Q14)
  {
    id: "q17",
    question: "Q14. Which attempt are you targeting? (Time Horizon)",
    options: [
      "JEE 2027",
      "JEE 2028"
    ],
    weights: [0, 0]
  },
  // 15 -> q18 (Mock Score Baseline - Displayed as Q15)
  {
    id: "q18",
    question: "Q15. In a recent full-length JEE Main–level test, where do you realistically stand?",
    options: [
      "I consistently score 180+ in mocks (or I am confident I can solve 60%+ of the paper today).",
      "I usually score between 120 - 180 (or I can solve roughly half the paper).",
      "I am stuck between 50 - 100 (or I struggle to solve even 20 questions correctly).",
      "I generally can’t score more than 50 marks in JEE Mains Mock Tests."
    ],
    weights: [0, 0, 0, 0]
  },
  // 16 -> q19 (Active vs Passive Split - Displayed as Q16)
  {
    id: "q19",
    question: "Q16. Out of your daily study time, how is your hours distribution split between watching lectures versus solving questions on your own?",
    options: [
      "80% Lectures / 20% Solving",
      "60% Lectures / 40% Solving",
      "50% Lectures / 50% Solving",
      "20% Lectures / 80% Solving"
    ],
    weights: [0.3, 0.5, 0.8, 1.0]
  }
];

// -------------------- SECTION MAP (For 16 Questions) --------------------
const SECTIONS = [
  {
    key: "habits",
    color: "#c62828",
    colorSoft: "#fdeaea",
    title: "Your Study Habits",
    subtitle: "Let's see how consistent you really are.",
    startStep: 1,
    endStep: 2, // Q1 - Q2 (2 questions)
  },
  {
    key: "academics",
    color: "#2563eb",
    colorSoft: "#eaf1fe",
    title: "Academic Reality Check",
    subtitle: "Time to be brutally honest about where you stand.",
    startStep: 3,
    endStep: 8, // Q3 - Q8 (6 questions)
  },
  {
    key: "mindset",
    color: "#7c3aed",
    colorSoft: "#f1eafe",
    title: "Under the Hood",
    subtitle: "The mental patterns behind your prep.",
    reflection: "Academics: mapped.",
    startStep: 9,
    endStep: 11, // Q9 - Q11 (3 questions)
  },
  {
    key: "environment",
    color: "#ea580c",
    colorSoft: "#fef1ea",
    title: "Your Environment & Edge",
    subtitle: "The external factors shaping your prep.",
    reflection: "Your mindset: captured.",
    startStep: 12,
    endStep: 16, // Q12 - Q16 (5 questions)
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
  1: 5, 2: 0, 3: 8, 4: 2, 5: 10, 6: 3,
  7: 6, 8: 1, 9: 9, 11: 4, 13: 11, 15: 7,
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
              animation: `particle-fly 1.3s cubic-bezier(0.3,0.6,0.4,1) forwards`,
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

// Status tier mapper for qualitative display
const getStatusTier = (ratio) => {
  if (ratio >= 0.7) {
    return { label: "HIGH", color: "#16a34a", bg: "#dcfce7", border: "#86efac" };
  }
  if (ratio >= 0.45) {
    return { label: "MEDIUM", color: "#d97706", bg: "#fef3c7", border: "#fde68a" };
  }
  return { label: "LOW", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" };
};

// One row of the JAS breakdown — replaces raw numbers with LOW / MEDIUM / HIGH badges
const BreakdownRow = ({ item, delay }) => {
  const [progress, setProgress] = useState(0);
  const rowRef = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) return;

    let raf;
    let startTimeout;
    const duration = 1800;
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
  }, [delay]);

  const Icon = BREAKDOWN_ICONS[item.key] || IconTarget;
  const tier = getStatusTier(item.ratio || 0);
  const width = progress * (item.ratio || 0.1) * 100;

  return (
    <div ref={rowRef} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "16px 0", borderBottom: "1px solid #f1f1f1" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${tier.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
        <div style={{ transform: "scale(1.35)" }}>
          <Icon color={tier.color} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "7px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b" }}>{item.label}</span>
          <span style={{
            fontSize: "12px",
            fontWeight: "900",
            color: tier.color,
            background: tier.bg,
            border: `1px solid ${tier.border}`,
            padding: "3px 12px",
            borderRadius: "20px",
            letterSpacing: "0.5px"
          }}>
            {tier.label}
          </span>
        </div>
        <div style={{ height: "9px", background: "#f1f1f1", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${width}%`, background: tier.color, borderRadius: "6px", transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontSize: "13.5px", color: "#64748b", marginTop: "7px", fontWeight: "500" }}>{item.status}</div>
      </div>
    </div>
  );
};

// Full breakdown card with qualitative status levels
const JASBreakdownCard = ({ breakdown }) => (
  <div style={{ background: "#fff", borderRadius: "20px", padding: "26px 24px", boxShadow: "0 10px 30px rgba(0,0,0,0.06)", border: "1px solid #f1f1f1" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>Your JAS: Area Breakdown</h3>
    </div>
    <p style={{ margin: "4px 0 6px", fontSize: "15px", color: "#64748b" }}>
      Your qualitative readiness rating across all 5 key preparation pillars:
    </p>
    <div>
      {breakdown.map((item, i) => (
        <BreakdownRow key={item.key} item={item} delay={200 + i * 140} />
      ))}
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

  // Clamp safely so the "You are here" pill never clips off container edges
  const safePct = Math.max(6, Math.min(94, animPct));
  const markerX = 20 + (safePct / 100) * 360;

  // RULE 1: Hide potential completely if student is already ahead of 85% or more
  const showPotential = (percentile || 0) < 85;

  // RULE 2: Dynamic potential (scales between 87% and 93% based on student's baseline instead of being fixed)
  const dynamicPotentialPct = Math.min(93, Math.round(86 + (percentile * 0.08)));
  const potentialX = 20 + (dynamicPotentialPct / 100) * 360;

  return (
    <div style={{ position: "relative", padding: "38px 10px 14px" }}>
      <style>{`
        @keyframes marker-drop {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <svg width="100%" viewBox="0 0 400 134" style={{ overflow: "visible", display: "block" }}>
        <defs>
          <linearGradient id="pct-fill" x1="0" x2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.04" />
            <stop offset="100%" stopColor={color} stopOpacity="0.28" />
          </linearGradient>
        </defs>

        {/* Main Curve */}
        <path d="M20,95 C90,95 130,15 200,15 C270,15 310,95 380,95" fill="none" stroke="#e2e8f0" strokeWidth="2" />
        <path
          d={`M20,95 C90,95 130,15 200,15 C270,15 310,95 380,95 L${markerX},95 L20,95 Z`}
          fill="url(#pct-fill)"
          opacity={animPct > 0 ? 1 : 0}
          style={{ transition: "opacity 0.8s ease" }}
        />

        {/* 1. Reference: Average Student (50% at x=200) */}
        <line x1="200" y1="22" x2="200" y2="95" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="200" cy="22" r="3" fill="#94a3b8" />
        <text x="200" y="111" textAnchor="middle" fill="#64748b" fontSize="10.5" fontWeight="600">
          Avg (50%)
        </text>

        {/* 2. Dynamic Potential (Only renders if percentile < 85%) */}
        {showPotential && (
          <g>
            <line x1={potentialX} y1="36" x2={potentialX} y2="95" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx={potentialX} cy="36" r="4" fill="#10b981" />
            <text x={potentialX} y="125" textAnchor="middle" fill="#059669" fontSize="10" fontWeight="800">
              Potential
            </text>
          </g>
        )}

        {/* 3. Reference: Top 1% IITians (at x=372) */}
        <line x1="372" y1="52" x2="372" y2="95" stroke="#d97706" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="372" cy="52" r="3.5" fill="#d97706" />
        <text x="372" y="111" textAnchor="middle" fill="#d97706" fontSize="10.5" fontWeight="700">
          Top 1%
        </text>

        {/* 4. Dynamic User Marker */}
        <line
          x1={markerX}
          y1="12"
          x2={markerX}
          y2="95"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray="4 4"
          style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
        <circle
          cx={markerX}
          cy="15"
          r="6.5"
          fill={color}
          style={{ transition: "all 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>

      {/* Floating User "You are here" Pill */}
      <div
        style={{
          position: "absolute",
          left: `${(markerX / 400) * 100}%`,
          top: "0px",
          transform: "translateX(-50%)",
          background: color,
          color: "#fff",
          padding: "5px 12px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "800",
          whiteSpace: "nowrap",
          boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
          transition: "left 1.1s cubic-bezier(0.16,1,0.3,1)",
          animation: "marker-drop 0.5s ease 0.3s both",
          zIndex: 10
        }}
      >
        You are here
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
      {/* --- PASTE THIS DIRECTLY ABOVE "You're ahead of..." --- */}
<div style={{ textAlign: "center", marginBottom: "16px" }}>
  <div style={{ 
    fontSize: "12px", 
    fontWeight: "800", 
    color: "#6a11cb", 
    letterSpacing: "1px", 
    textTransform: "uppercase" 
  }}>
    All-India Benchmark
  </div>
  <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
    Where You Stand Across All JEE Aspirants
  </h4>
</div>
  {(() => {
  const roundedPct = Math.min(99, Math.max(1, Math.round(percentile || 0)));
  const isTopTier = roundedPct >= 99;

  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ fontSize: "18px", color: "#475569", fontWeight: "700" }}>
        {isTopTier ? "You're in the" : "You're ahead of"}
      </span>
      <span style={{ fontSize: "42px", fontWeight: "900", color, lineHeight: "1" }}>
        {isTopTier ? "Top 1%" : `${roundedPct}%`}
      </span>
      <span style={{ fontSize: "18px", color: "#475569", fontWeight: "700" }}>
        {isTopTier ? "of all aspirants nationwide 🏆" : "of aspirants right now..."}
      </span>
    </div>
  );
})()}
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
      What Top 1% Students do differently
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
  { Icon: IconPie, label: "REF Analysis", desc: "Review . Evaluate . Focus" },
  { Icon: IconTarget, label: "SWOT Deep-Dive", desc: "Strength, Weakness, Opportunity, Threat" },
  { Icon: IconClipboard, label: "14-Day Action Plan", desc: "Specific daily fixes, not generic advice" },
  { Icon: IconTrendUp, label: "Important Chapters", desc: "Key topics to focus on for maximum impact" },
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

const DownloadCTAButton = ({ onClick, isGenerating, label, sublabel, hasDownloaded = false }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      width: "100%",
    }}
  >
    <style>{`
      @keyframes cta-sheen {
        0% { transform: translateX(-150%) skewX(-20deg); }
        35%, 100% { transform: translateX(250%) skewX(-20deg); }
      }
      @keyframes urgency-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes radar-ping {
        0% { transform: scale(1); opacity: 0.9; }
        75%, 100% { transform: scale(2.4); opacity: 0; }
      }
      @keyframes border-glow-pulse {
        0%, 100% { box-shadow: 0 12px 30px -4px rgba(124, 58, 237, 0.45), 0 0 0 1px rgba(255,255,255,0.18) inset; }
        50% { box-shadow: 0 16px 38px -2px rgba(37, 99, 235, 0.65), 0 0 0 2px rgba(255,255,255,0.32) inset; }
      }
    `}</style>

    {/* 1. CLEAN FLOATING "FREE FOR NOW" BADGE (No overlap with button border) */}
    {!hasDownloaded && !isGenerating && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "8px",
          animation: "urgency-float 2.6s ease-in-out infinite",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
            border: "1.5px solid #38bdf8",
            borderRadius: "999px",
            padding: "6px 14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.3), 0 0 12px rgba(56, 189, 248, 0.35)",
            whiteSpace: "nowrap",
          }}
        >
          {/* Live Pulsing Green Dot */}
          <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "8px", height: "8px", flexShrink: 0 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "#4ade80",
                animation: "radar-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
              }}
            />
            <span
              style={{
                position: "relative",
                display: "block",
                borderRadius: "50%",
                width: "8px",
                height: "8px",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
              }}
            />
          </span>

          {/* Optically Centered Text + Divider */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: "900",
              letterSpacing: "0.7px",
              textTransform: "uppercase",
              color: "#ffffff",
              lineHeight: 1,
            }}
          >
            <span>FREE FOR NOW</span>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8", display: "inline-block" }} />
            <span style={{ color: "#38bdf8" }}>INSTANT UNLOCK</span>
          </span>

          {/* Gold Lightning Bolt SVG */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#facc15" style={{ flexShrink: 0, display: "block" }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        {/* Tiny Pointer Caret Aiming at Button */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #38bdf8",
            marginTop: "-1px",
          }}
        />
      </div>
    )}

    {/* 2. MAIN CTA BUTTON */}
    <button
      onClick={onClick}
      disabled={isGenerating}
      className="jee-lock-trigger"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "17px 44px",
        borderRadius: "16px",
        background: isGenerating
          ? "#94a3b8"
          : "linear-gradient(135deg, #2563eb 0%, #6d28d9 55%, #7c3aed 100%)",
        color: "white",
        fontSize: "17.5px",
        fontWeight: "800",
        letterSpacing: "-0.2px",
        lineHeight: 1,
        border: "none",
        cursor: isGenerating ? "not-allowed" : "pointer",
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        animation: isGenerating ? "none" : "border-glow-pulse 3s infinite ease-in-out",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
      }}
      onMouseEnter={(e) => {
        if (!isGenerating) e.currentTarget.style.transform = "translateY(-3px) scale(1.015)";
      }}
      onMouseLeave={(e) => {
        if (!isGenerating) e.currentTarget.style.transform = "translateY(0) scale(1)";
      }}
    >
      {/* Animated Glossy Light Sweep */}
      {!isGenerating && (
        <span
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "45%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            animation: "cta-sheen 3.8s infinite ease-in-out",
            pointerEvents: "none",
          }}
        />
      )}

      {!isGenerating && (
        <span style={{ display: "inline-flex", alignItems: "center", transform: "translateY(-1px)" }}>
          <LockIcon size={19} color="#fff" />
        </span>
      )}
      <span style={{ position: "relative", zIndex: 2, lineHeight: 1 }}>
        {isGenerating ? "Generating PDF..." : label}
      </span>
    </button>

    {sublabel && (
      <div style={{ fontSize: "13.5px", color: "#64748b", marginTop: "10px", fontWeight: "600" }}>
        {sublabel}
      </div>
    )}
  </div>
);

const sanitizeAnswersForScoring = (rawAnswers) => {
  const clean = {};
  Object.keys(rawAnswers || {}).forEach((key) => {
    const val = rawAnswers[key];
    if (Array.isArray(val)) {
      clean[key] = val.length > 0 ? Number(val[0]) : 0;
    } else if (val !== undefined && val !== "") {
      clean[key] = !isNaN(Number(val)) ? Number(val) : val;
    }
  });

  // Auto-fill removed questions so utils/score.js needs ZERO changes:
  if (clean.q14 === undefined) clean.q14 = clean.q13 !== undefined ? clean.q13 : 1; // Mirrors Energy -> Health
  if (clean.q16 === undefined) clean.q16 = clean.q15 !== undefined ? clean.q15 : 1; // Mirrors Environment -> Home
  if (clean.q12 === undefined) clean.q12 = clean.q1 !== undefined ? clean.q1 : 1;
  if (clean.q20 === undefined) clean.q20 = 0;

  return clean;
};

// --- 11 STUDENT-FOCUSED ROTATING MESSAGES (NO TECH JARGON) ---
const REPORT_GENERATION_MESSAGES = [
  "Analyzing your Physics, Chemistry & Maths balance...",
  "Comparing your habits with Top 1% IITian benchmarks...",
  "Identifying hidden negative-marking traps in your mocks...",
  "Mapping your Preparation Smartness Score (PSS) trajectory...",
  "Pinpointing your biggest daily focus & revision leaks...",
  "Building your personalized R.E.F (Recall, Error, Focus) analysis...",
  "Evaluating your NTA tie-breaker advantage across subjects...",
  "Crafting subject-wise expert remedies & tactical advice...",
  "Designing your step-by-step 24-hour & 7-day execution plan...",
  "Attaching custom printable trackers & revision sheets...",
  "Putting final touches on your personalized JEE strategy report..."
];

export default function StudentSwotForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSWOT, setShowSWOT] = useState(false);
  const [finalSWOT, setFinalSWOT] = useState({ S: "", W: "", O: "", T: "" });

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOfferFree, setIsOfferFree] = useState(false); // true = Free Flow | false = Paid Razorpay Flow
  const REPORT_PRICE = isOfferFree ? 0 : 99; // Price in INR (₹99)
  const RAZORPAY_KEY_ID = "rzp_live_YOUR_KEY_HERE"; // <-- Replace with your Razorpay Key ID

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // --- AFTER-DOWNLOAD & PAYMENT FLOW STATES ---
  // "IDLE" | "PAYMENT_CONFIRMED" | "GENERATING" | "SUCCESS"
  const [downloadPopupState, setDownloadPopupState] = useState("IDLE");
  const [rotatingMsgIndex, setRotatingMsgIndex] = useState(0);
  const [isPopupFadingOut, setIsPopupFadingOut] = useState(false);
  const [hasDownloadedOnce, setHasDownloadedOnce] = useState(false);
  const [cachedPdfUrl, setCachedPdfUrl] = useState(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [paymentId, setPaymentId] = useState("");

  // Rotate through the 11 messages every 1.6 seconds while generating
  useEffect(() => {
    if (downloadPopupState !== "GENERATING") return;

    const interval = setInterval(() => {
      setRotatingMsgIndex((prev) => (prev + 1) % REPORT_GENERATION_MESSAGES.length);
    }, 1600);

    return () => clearInterval(interval);
  }, [downloadPopupState]);

  const handleStartNewAssessment = () => {
    setStep(0);
    setAnswers({});
    setShowSWOT(false);
    setIsPacking(false);
    setResolvedBlocks({});
    setShowSectionIntro(null);
    setMilestoneToast(null);
    setShowMobilePreview(false);
    setDownloadPopupState("IDLE");
    setHasDownloadedOnce(false);
    setHasPaid(false);
    setPaymentId("");
    if (cachedPdfUrl) window.URL.revokeObjectURL(cachedPdfUrl);
    setCachedPdfUrl(null);
    shownSectionIntros.current = new Set();
    shownMilestones.current = new Set();
  };

  const [isGenerating, setIsGenerating] = useState(false);

  // --- SECTIONING + MILESTONE STATE ---
  const [showSectionIntro, setShowSectionIntro] = useState(null);
  const [milestoneToast, setMilestoneToast] = useState(null);
  const shownSectionIntros = useRef(new Set());
  const shownMilestones = useRef(new Set());
  const milestoneTimeoutRef = useRef(null);

  // --- LIVING REPORT PREVIEW STATE ---
  const [resolvedBlocks, setResolvedBlocks] = useState({});
  const [isPacking, setIsPacking] = useState(false);
  const [bursts, setBursts] = useState([]);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 1100 : false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [pillPulseColor, setPillPulseColor] = useState(null);
  const [pillPhase, setPillPhase] = useState("idle");
  const reportCardRef = useRef(null);
  const peekPillRef = useRef(null);
  const blockRefs = useRef(Array(REPORT_BLOCKS.length + 1).fill(null));
  const lastOptionPointRef = useRef({ 
    x: typeof window !== "undefined" ? window.innerWidth - 40 : 0, 
    y: typeof window !== "undefined" ? window.innerHeight - 100 : 0 
  });
  const pillPulseTimeoutRef = useRef(null);
  const mobilePreviewTimeoutRef = useRef(null);
  const sectionAdvanceTimeoutsRef = useRef([]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

useEffect(() => {
    if (!showSWOT) return;

    const handleScroll = () => {
      if (!firstCtaRef.current || !lastCtaRef.current) return;

      const firstRect = firstCtaRef.current.getBoundingClientRect();
      const lastRect = lastCtaRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Trigger: When CTA 1 has scrolled 60px past top of screen
      const isPastFirstCta = firstRect.bottom < -60;

      // Exit: When final CTA banner comes within 100px of entering viewport
      const isReachingLastCta = lastRect.top <= viewportHeight - 100;

      setShowStickyCta(isPastFirstCta && !isReachingLastCta);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showSWOT]);

const [showStickyCta, setShowStickyCta] = useState(false);
  const firstCtaRef = useRef(null);
  const lastCtaRef = useRef(null);

  useEffect(() => {
    if (!showSWOT) return;

    const handleScroll = () => {
      if (!firstCtaRef.current || !lastCtaRef.current) return;

      const firstRect = firstCtaRef.current.getBoundingClientRect();
      const lastRect = lastCtaRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const isPastFirstCta = firstRect.bottom < 0;
      const isReachingLastCta = lastRect.top <= viewportHeight - 30;

      setShowStickyCta(isPastFirstCta && !isReachingLastCta);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [showSWOT]);

  // --- SOUND SYNTHESIZER ---
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
    } catch (e) {}
  };

  const playSelectTick = () => playTone(720, 0.05, 0, 0.2);
  const playSectionChime = () => {
    playTone(523.25, 0.14, 0, 0.22);
    playTone(659.25, 0.16, 0.09, 0.22);
  };

  // --- SELECTION MICRO-FEEDBACK ---
  const [ripple, setRipple] = useState(null);
  const [pulseIdx, setPulseIdx] = useState(null);
  const rippleTimeoutRef = useRef(null);
  const pulseTimeoutRef = useRef(null);

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

  // Progress Calculations
  const TOTAL_QUESTIONS = 16;
  const BASE_PROGRESS = 8;
  const currentQuestionIndex = Math.max(step - 1, 0); 
  const progressPercent = Math.min(
    Math.round(BASE_PROGRESS + (currentQuestionIndex / TOTAL_QUESTIONS) * (100 - BASE_PROGRESS)),
    100
  );

  const activeSection = getSectionForStep(step);
  const activeSectionIndex = activeSection ? SECTIONS.indexOf(activeSection) : -1;
  const studentName = (answers.name || "").trim();

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
  }, [step]);

  useEffect(() => {
    MILESTONES.forEach((m) => {
      if (progressPercent >= m.at && !shownMilestones.current.has(m.at)) {
        shownMilestones.current.add(m.at);
        clearTimeout(milestoneTimeoutRef.current);
        setMilestoneToast(m.text(studentName));
        milestoneTimeoutRef.current = setTimeout(() => setMilestoneToast(null), 2200);
      }
    });
  }, [progressPercent]);

  // Validation helper: Ensures single choice or at least 1 checkbox is picked
  const isCurrentQuestionAnswered = () => {
    if (step === 0) return Boolean((answers.name || "").trim());
    const q = QUESTIONS[step];
    if (!q) return true;
    const val = answers[q.id];
    if (q.multi) {
      return Array.isArray(val) && val.length > 0;
    }
    return val !== undefined && val !== "";
  };

  const handleChange = (value) => {
    setAnswers({ ...answers, [QUESTIONS[step].id]: value });
  };

  // Dual Single/Multi-Select Handler with Animation Anchors
  const selectOption = (idx, e) => {
    const q = QUESTIONS[step];
    if (!q) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ idx, x: e.clientX - rect.left, y: e.clientY - rect.top, id: Date.now() });
    clearTimeout(rippleTimeoutRef.current);
    rippleTimeoutRef.current = setTimeout(() => setRipple(null), 550);

    setPulseIdx(idx);
    clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setPulseIdx(null), 380);

    lastOptionPointRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    const qId = q.id;

    if (q.multi) {
      setAnswers((prev) => {
        const currentArr = Array.isArray(prev[qId])
          ? [...prev[qId]]
          : prev[qId] !== undefined && prev[qId] !== "" ? [Number(prev[qId])] : [];

        const numIdx = Number(idx);
        const exists = currentArr.includes(numIdx);

        let updated;
        if (exists) {
          updated = currentArr.filter((item) => item !== numIdx);
        } else {
          const max = q.maxSelect || 2;
          if (currentArr.length >= max) return prev;
          updated = [...currentArr, numIdx];
        }
        return { ...prev, [qId]: updated };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: Number(idx) }));
    }

    playSelectTick();
  };

  const fireBurst = (currentStep, blockIdxOverride) => {
    const section = getSectionForStep(currentStep);
    const color = section ? section.color : "#c62828";
    const { x: sx, y: sy } = lastOptionPointRef.current;
    const blockIdx = blockIdxOverride !== undefined ? blockIdxOverride : STEP_BLOCK_MAP[currentStep];

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

  const handleNextClick = () => {
    if (!isCurrentQuestionAnswered()) return;

    const currentStep = step;
    const nextStep = currentStep + 1;
    const enteringNewSection = currentStep > 0 && SECTIONS.some((s) => s.startStep === nextStep);

    if (currentStep > 0) fireBurst(currentStep);

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
      const t1 = setTimeout(() => next(), 1100);
      sectionAdvanceTimeoutsRef.current = [t1];
    }
  };

  // Safe SWOT calculation supporting array or string choices for q13/q15
  const calculateSWOT = () => {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const getResponse = (lib, rawVal) => {
      if (!lib) return "Data missing";
      if (rawVal === undefined || rawVal === "") return pick(lib[0] || ["Data missing"]);

      if (Array.isArray(rawVal)) {
        if (rawVal.length === 0) return pick(lib[0] || ["Data missing"]);

        // Exactly 1 pick: Returns the EXACT single response from the old version
        if (rawVal.length === 1) {
          const idx = Number(rawVal[0]);
          return pick(lib[idx] || lib[0]);
        }

        // 2 picks: Combines both insights cleanly without breaking format
        const first = pick(lib[Number(rawVal[0])] || lib[0]);
        const second = pick(lib[Number(rawVal[1])] || lib[0]);
        return `${first} Additionally: ${second}`;
      }

      // Standard number/string
      return pick(lib[Number(rawVal)] || lib[0]);
    };

    setFinalSWOT({
      S: getResponse(StrengthResponses, answers["q1"]),
      W: getResponse(WeaknessResponses, answers["q3"]),
      O: getResponse(OpportunityResponses, answers["q13"]),
      T: getResponse(ThreatResponses, answers["q15"]),
    });

    setShowSWOT(true);
  };

  const handleFinalSubmit = () => {
    if (!isCurrentQuestionAnswered()) return;
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

  // --------------------------------------------------------
  // DIRECT FREE PDF DOWNLOAD HANDLER (With Memory Cache)
  // --------------------------------------------------------
  const triggerBrowserDownload = (blobUrl, rawName) => {
    const safeName = (rawName || "Student").trim().replace(/\s+/g, "_");
    const filename = `JEEsociety_Report_${safeName}.pdf`;

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 1000);
  };

  const showSuccessAndFadeOut = () => {
    setDownloadPopupState("SUCCESS");
    setHasDownloadedOnce(true);
    setIsPopupFadingOut(false);

    // Start smooth fade-out at 2.6s, fully close at 3.0s
    setTimeout(() => {
      setIsPopupFadingOut(true);
    }, 2600);

    setTimeout(() => {
      setDownloadPopupState("IDLE");
      setIsPopupFadingOut(false);
    }, 3000);
  };

  const handleDownloadReport = async () => {
    if (isGenerating || downloadPopupState === "GENERATING") return;

    // Instant re-download if already generated in this session
    if (cachedPdfUrl) {
      triggerBrowserDownload(cachedPdfUrl, answers["name"]);
      showSuccessAndFadeOut();
      return;
    }

    setIsGenerating(true);
    setRotatingMsgIndex(0);
    setIsPopupFadingOut(false);
    setDownloadPopupState("GENERATING");

    const cleanAnswers = sanitizeAnswersForScoring(answers);
    const result = computeScores(cleanAnswers);

    const {
      jee_society_score,
      expected_percentile_range,
      potential_percentile_range,
      breakdown,
    } = result;

    const q17Obj = QUESTIONS.find((q) => q.id === "q17");
    const attemptIndex = answers["q17"];
    const attemptLabel =
      q17Obj && q17Obj.options[attemptIndex] ? q17Obj.options[attemptIndex] : "2028";

    const safeExpected = expected_percentile_range || [0, 0];
    const safePotential = potential_percentile_range || [0, 0];

    const optionMap = ["A", "B", "C", "D", "E"];
    const generatedManifestKeys = {};

    Object.keys(answers).forEach((key) => {
      if (!key.startsWith("q")) return;
      const val = answers[key];
      const prefix = key.toUpperCase();

      if (Array.isArray(val)) {
        if (val.length === 1) {
          const idx = Number(val[0]);
          if (optionMap[idx]) generatedManifestKeys[key] = `${prefix}_${optionMap[idx]}`;
        } else if (val.length > 1) {
          generatedManifestKeys[key] = val
            .map((idx) => (optionMap[Number(idx)] ? `${prefix}_${optionMap[Number(idx)]}` : null))
            .filter(Boolean);
        }
      } else {
        const idx = Number(val);
        if (!isNaN(idx) && optionMap[idx]) {
          generatedManifestKeys[key] = `${prefix}_${optionMap[idx]}`;
        }
      }
    });

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
        threats: finalSWOT.T,
      },
      recommendations: "Focus on your flagged weaknesses. Use the Opportunity areas to gain extra marks.",
      manifestKeys: generatedManifestKeys,
      breakdown: breakdown,
    };

    try {
      const response = await fetch(
        "https://backend-final-510329279046.asia-south1.run.app/send-dynamic-report",
        {
          method: "POST",
          mode: "cors",
          headers: {
            Accept: "application/pdf, application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportPayload),
        }
      );

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      setCachedPdfUrl(url);

      // Save file to student's device
      triggerBrowserDownload(url, answers["name"]);

      // Show "Report Downloaded Successfully" & fade out in 3s
      showSuccessAndFadeOut();
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadPopupState("IDLE");
      alert("Preparing your report took slightly longer than expected. Please tap the button once more.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------- RENDER: RESULTS PAGE (STUDENT-FACING, CONVERSION-OPTIMIZED) ----------------
  if (showSWOT) {
    const cleanAnswers = sanitizeAnswersForScoring(answers);
    const scores = computeScores(cleanAnswers);
    const { jee_society_score } = scores;
    
// --- DYNAMIC SCORES & EDGE-CASE HANDLING ---
const currentScore = Math.round(parseFloat(jee_society_score) || 38);
const avgScore = 45;
const top1Score = 95;

// Dynamic Potential Calculation: Never drops below currentScore
let potentialScore;
if (currentScore >= 95) {
  potentialScore = 99; // Elite tier aiming for top double-digit AIR
} else if (currentScore >= 85) {
  potentialScore = Math.min(98, currentScore + 8);
} else {
  // Normal/Developing tier: Boost by 35-40, capped between 88 and 93
  potentialScore = Math.min(93, Math.max(Math.round(currentScore + 36), 88));
}

const isElite = currentScore >= top1Score;
const isStrong = currentScore >= 80 && currentScore < top1Score;

    const attemptIndex = cleanAnswers["q17"];
    const attemptLabel = (QUESTIONS.find(q => q.id === "q17")?.options || [])[attemptIndex] || "JEE Main";

    const numScore = Number(jee_society_score) || 0;
    const readinessGap = (100 - numScore).toFixed(2).replace(/\.00$/, "");
    const closeableWeeks = Math.max(3, Math.round((100 - numScore) / 3.5));

    const rowStyle = {
      display: "flex", flexWrap: "wrap", alignItems: "center",
      justifyContent: "center", gap: "30px", marginBottom: "26px", textAlign: "left"
    };

    const boxStyle = (color, bg) => ({
      flex: "1 1 300px", minWidth: "280px", background: bg,
      padding: "20px", borderRadius: "12px", borderLeft: `6px solid ${color}`,
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
    });

    const reportBulletItems = [
      {
        title: "Complete SWOT Analysis",
        desc: "Hidden threats & high-yield score opportunities"
      },
      {
        title: "Subject Scoring Blueprint",
        desc: "Tactical roadmaps for Physics, Chem & Maths"
      },
      {
        title: "R.E.F Diagnostic",
        desc: "Recall • Error • Focus system to stop mark leaks"
      },
      {
        title: "Personalized Action Plan",
        desc: "Immediate 24-hour & 7-day tactical fixes"
      },
      {
        title: "Desk Printables",
        desc: "90-day habit grid, mock test tracker, & more"
      }
    ];

    return (
      <div className="assessment-wrapper swot-container" style={{ maxWidth: "760px", margin: "0 auto", fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>
        
        {/* Top Header: Greeting + WhatsApp Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            {studentName ? (
              <p style={{ fontSize: "16px", color: "#666", margin: 0 }}>
                Great work, <strong>{studentName}</strong>. Here's your full breakdown.
              </p>
            ) : <div />}
          </div>

          <a
            href="https://whatsapp.com/channel/0029VbDZ6FnGE56sPOiSVL0a"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "8px 18px", borderRadius: "50px",
                background: "#25D366", color: "white",
                fontSize: "13.5px", fontWeight: "700", border: "none",
                cursor: "pointer", boxShadow: "0 3px 12px rgba(37, 211, 102, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 5px 16px rgba(37, 211, 102, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 3px 12px rgba(37, 211, 102, 0.3)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              WhatsApp Channel
            </button>
          </a>
        </div>

        <h2 style={{ marginBottom: "10px", fontSize: "28px" }}>Your Performance Summary</h2>

        <div style={{ marginBottom: "26px", color: "#666", fontSize: "16px", background: "#f1f1f1", display: "inline-block", padding: "6px 18px", borderRadius: "20px" }}>
          Target: <strong>{attemptLabel}</strong>
        </div>

        {/* 1. JAS SCORE REVEAL */}
        {/* PSS CIRCLE + INFO CONTAINER */}
<div style={{
  display: "flex",
  flexWrap: "wrap",
  gap: "24px",
  alignItems: "center",
  background: "#ffffff",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
  border: "1px solid #e2e8f0",
  marginBottom: "28px"
}}>
  
  {/* 1. ENHANCED CIRCULAR GAUGE WITH MARKERS */}
  <div style={{ position: "relative", width: "170px", height: "170px", flexShrink: 0, margin: "0 auto" }}>
    <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: "rotate(-90deg)" }}>
      {/* Background Track */}
      <circle
        cx="85"
        cy="85"
        r="68"
        stroke="#f1f5f9"
        strokeWidth="12"
        fill="transparent"
      />
      {/* Progress Arc for Current PSS */}
      <circle
        cx="85"
        cy="85"
        r="68"
        stroke="url(#pssGradient)"
        strokeWidth="12"
        strokeDasharray={2 * Math.PI * 68}
        strokeDashoffset={2 * Math.PI * 68 * (1 - currentScore / 100)}
        strokeLinecap="round"
        fill="transparent"
        style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
      />
      
      {/* Marker: Average (45%) */}
      <circle
        cx={85 + 68 * Math.cos((avgScore / 100) * 2 * Math.PI)}
        cy={85 + 68 * Math.sin((avgScore / 100) * 2 * Math.PI)}
        r="4"
        fill="#94a3b8"
      />

      {/* Marker: Potential (~88-92%) */}
      <circle
        cx={85 + 68 * Math.cos((potentialScore / 100) * 2 * Math.PI)}
        cy={85 + 68 * Math.sin((potentialScore / 100) * 2 * Math.PI)}
        r="6"
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth="2"
      />

      {/* Marker: Top 1% (96%) */}
      <circle
        cx={85 + 68 * Math.cos((top1Score / 100) * 2 * Math.PI)}
        cy={85 + 68 * Math.sin((top1Score / 100) * 2 * Math.PI)}
        r="5"
        fill="#ef4444"
        stroke="#ffffff"
        strokeWidth="1.5"
      />

      <defs>
        <linearGradient id="pssGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6a11cb" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>

    {/* Center Score Label */}
    <div style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      textAlign: "center"
    }}>
      <div style={{ fontSize: "13px", fontWeight: "800", color: "#6a11cb", letterSpacing: "0.5px" }}>PSS</div>
      <div style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", lineHeight: "1.1" }}>{currentScore}</div>
      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>/ 100</div>
    </div>
  </div>

           <div style={{
  ...boxStyle("#6a11cb", "#f8f9fa"),
  padding: "22px 25px",
  borderLeft: "7px solid #6a11cb"
}}>
  <h3 style={{ margin: "0 0 10px 0", color: "#6a11cb", fontSize: "22px", fontWeight: "800" }}>
    PSS (Preparation Smartness Score)
  </h3>

  <p style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#333", lineHeight: "1.65" }}>
    Your preparation habits are currently operating at <b>{jee_society_score}% efficiency</b>.
  </p>

  {/* Non-JEE Score Disclaimer */}
    <div style={{
      background: "rgba(106, 17, 203, 0.06)",
      padding: "9px 13px",
      borderRadius: "8px",
      margin: "0 0 12px 0",
      fontSize: "13px",
      color: "#4a148c",
      lineHeight: "1.5",
      borderLeft: "3.5px solid #6a11cb"
    }}>
    💡 <b>Note:</b> This is <b>not</b> your JEE mock marks out of 300. It measures your day-to-day execution - how smartly you revise, whether your study hours actually stick, and how well you avoid negative marks.
  </div>

  <p style={{ margin: 0, fontSize: "15px", color: "#1e293b", lineHeight: "1.65", fontWeight: "600" }}>
    Toppers have built systems <b>{readinessGap} points of readiness ahead</b> of where you are today, and that gap is realistically closeable in about <b>{closeableWeeks} weeks</b> with the right daily plan.
  </p>
</div>
{/* Marker Legend Pills */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", fontWeight: "700" }}>
      <span style={{ background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: "6px" }}>
        ⚪ Avg Aspirant: 35
      </span>
      <span style={{ background: "#ecfdf5", color: "#047857", padding: "3px 8px", borderRadius: "6px" }}>
        🟢 Your Potential: {potentialScore}
      </span>
      <span style={{ background: "#fef2f2", color: "#b91c1c", padding: "3px 8px", borderRadius: "6px" }}>
        🔴 Top 1% IITians: 96+
      </span>
    </div>
        </div>

        {/* 2. GRAPH / PERCENTILE CARD */}
        <div style={{ marginBottom: "26px" }}>
          <PercentileCard percentile={scores.percentile_vs_aspirants} jss={jee_society_score} color="#c62828" />
        </div>

{/* ========================================================= */}
{/* STORYLINE & VERIFIABLE SOCIAL PROOF ABOVE 1ST CTA         */}
{/* ========================================================= */}
<div style={{ marginTop: "32px", marginBottom: "20px" }}>

  {/* 1. HIGH-CREDIBILITY SOCIAL PROOF CARD */}
  <div style={{
    background: "#fffbeb",
    border: "1.5px solid #fde68a",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "18px",
    boxShadow: "0 2px 10px rgba(245, 158, 11, 0.08)"
  }}>
    <div style={{
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "#fef3c7",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      flexShrink: 0
    }}>
      🎓
    </div>
    <div style={{ fontSize: "13.5px", color: "#78350f", lineHeight: "1.5" }}>
      <strong style={{ color: "#92400e", display: "block", fontSize: "14.5px", marginBottom: "2px" }}>
        You're not the only one downloading this audit today.
      </strong>
    Last year, <strong>340+ Class 12th & dropper students</strong> used this exact 15-page strategy blueprint and secure admissions into top IITs & NITs.
    </div>
  </div>

  {/* 2. THE TRANSITIONAL STORYLINE TO THE REPORT */}
  <div style={{
    textAlign: "center",
    maxWidth: "100%",
    margin: "0 auto 14px auto",
    padding: "0 10px"
  }}>
    <h4 style={{
      margin: "0 0 8px 0",
      fontSize: "20px",
      fontWeight: "900",
      color: "#0f172a",
      letterSpacing: "-0.3px"
    }}>
      {isElite ? (
    <>To Lock In Your <span style={{ color: "#10b981" }}>Top-500 Advanced AIR</span>, Download Your Report.</>
  ) : (
    <>To achieve your highest potential, <span style={{ color: "#10b981" }}>Download</span> your report.</>
    )}
    </h4>
  </div>

</div>

        {/* ========================================================= */}
        {/* 1. FIRST CTA (Triggers Sticky Bar When Scrolled Past)     */}
        {/* ========================================================= */}
        {/* 1st CTA */}
<div ref={firstCtaRef} style={{ marginBottom: "36px" }}>
  <DownloadCTAButton
    onClick={handleDownloadReport}
    isGenerating={isGenerating}
    hasDownloaded={hasDownloadedOnce}
    label={hasDownloadedOnce ? "Download Report Again ↓" : "Unlock My Full Report"}
    sublabel={
      hasDownloadedOnce
        ? "Saved to your device • Tap to download another copy"
        : "Get your full diagnosis, personalized SWOT & action blueprint"
    }
  />
</div>

<TestimonialCards />

        {/* 3. COMBINED: YOUR STRENGTH & WEAKNESS + WHAT'S INSIDE YOUR REPORT */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "30px 24px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          marginBottom: "44px"
        }}>
          {/* Strength & Weakness Sub-section */}
          <h2 style={{ marginTop: 0, marginBottom: "18px", fontSize: "24px", color: "#0f172a" }}>
            Your Strength & Weakness
          </h2>
          
          <div className="swot-card-white" style={{ marginBottom: "14px" }}>
            <span className="swot-pill-badge strength-badge">STRENGTH</span>
            <p className="swot-text">{finalSWOT.S}</p>
          </div>

          <div className="swot-card-white" style={{ marginBottom: "28px" }}>
            <span className="swot-pill-badge weakness-badge">WEAKNESS</span>
            <p className="swot-text">{finalSWOT.W}</p>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: "#e2e8f0", margin: "28px 0 24px" }} />

          {/* What's Inside Your Full Report in Bullet Points */}
          <div style={{ textAlign: "left" }}>
            <h3 style={{ fontSize: "19px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>
              What's Inside Your Full PDF Report
            </h3>
            <p style={{ fontSize: "13.5px", color: "#64748b", marginBottom: "14px" }}>
              A 15+ page data-backed dossier built specifically from your responses:
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {reportBulletItems.map((item, idx) => (
                <li
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "7px 0",
                    borderBottom: "1px dashed #f1f5f9"
                  }}
                >
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "#ecfdf5",
                    color: "#059669",
                    fontWeight: "900",
                    fontSize: "12px",
                    flexShrink: 0
                  }}>
                    ✓
                  </span>
                  <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                    <strong style={{ color: "#1e293b" }}>{item.title}:</strong>{" "}
                    <span style={{ color: "#64748b" }}>{item.desc}</span>
                  </div>
                </li>
              ))}

              {/* Subtle grey teaser item */}
              <li style={{
                paddingTop: "10px",
                paddingLeft: "30px",
                fontSize: "13.5px",
                fontWeight: "600",
                color: "#94a3b8",
                fontStyle: "italic",
                letterSpacing: "0.2px"
              }}>
                + and many more...
              </li>
            </ul>

            {/* --- SAMPLE REPORT LINK --- */}
            <div style={{ textAlign: "center", marginTop: "22px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
              <a
                href="/sample-report.pdf"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#6a11cb",
                  fontWeight: "700",
                  fontSize: "14.5px",
                  textDecoration: "underline",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#4a0082")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6a11cb")}
              >
                See what a finished report looks like →
              </a>
            </div>

          </div>
        </div>

        {/* 4. FOUNDER VIDEO (Now positioned directly below the combined section) */}
        <div style={{ marginTop: "10px", marginBottom: "40px" }}>
          <h3 style={{ textAlign: "center", fontSize: "20px", fontWeight: "800", color: "#0f172a", marginBottom: "10px" }}>
            Hear It Straight From The Founder
          </h3>
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

        

        {/* 5. TESTIMONIALS */}
        <div style={{ marginBottom: "44px" }}>
          <TestimonialsGrid />
        </div>

        {/* ========================================================= */}
        {/* 6. FINAL CTA BANNER (Sticky Bar Merges Back In Here)       */}
        {/* ========================================================= */}
        <div
          ref={lastCtaRef}
          style={{
            background: "linear-gradient(135deg, #0b0f19, #1e1330)",
            borderRadius: "20px",
            padding: "34px 24px",
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ fontSize: "21px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>
            Don't waste another week guessing.
          </div>
          <div style={{ fontSize: "15px", color: "#94a3b8", marginBottom: "22px" }}>
            Your personalized report, built entirely from your own answers, is ready right now.
          </div>
          {/* Final CTA */}
<DownloadCTAButton
  onClick={handleDownloadReport}
  isGenerating={isGenerating}
  hasDownloaded={hasDownloadedOnce}
  label={hasDownloadedOnce ? "Download Report Again ↓" : "Unlock My Full Report"}
/>
        </div>

        {/* BOTTOM CHANNELS / ACTION BUTTONS */}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
          <a
            href="https://whatsapp.com/channel/0029VbDZ6FnGE56sPOiSVL0a"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 28px", borderRadius: "50px",
                background: "#25D366", color: "white",
                fontSize: "16px", fontWeight: "700", border: "none",
                cursor: "pointer", boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 211, 102, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(37, 211, 102, 0.3)";
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
              </svg>
              WhatsApp Channel
            </button>
          </a>

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

        {/* Start New Assessment Button */}
        <div style={{ marginTop: "40px", textAlign: "center", paddingBottom: "20px" }}>
          <button
            onClick={handleStartNewAssessment}
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

{/* ========================================================= */}
{/* FLOATING DYNAMIC DOCK (Theme-Matched to Original CTA)     */}
{/* ========================================================= */}
<div
  style={{
    position: "fixed",
    bottom: "22px",
    left: "50%",
    zIndex: 9999,
    width: "calc(100% - 32px)",
    maxWidth: "560px",
    transform: showStickyCta
      ? "translateX(-50%) translateY(0) scale(1)"
      : "translateX(-50%) translateY(80px) scale(0.92)",
    opacity: showStickyCta ? 1 : 0,
    filter: showStickyCta ? "blur(0px)" : "blur(8px)",
    pointerEvents: showStickyCta ? "auto" : "none",
    transition: "transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.3s ease, filter 0.3s ease",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "14px",
      padding: "8px 10px 8px 18px",
      background: "rgba(15, 23, 42, 0.92)", // Obsidian glass
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "9999px",
      border: "1px solid rgba(255, 255, 255, 0.14)",
      animation: showStickyCta ? "cta-dock-glow 3.5s infinite ease-in-out" : "none",
    }}
  >
    {/* Left Side: Live Ready Status + Free For Now Pill */}
    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
      <div
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: "#22c55e",
          flexShrink: 0,
          animation: "live-pulse-dot 2s infinite"
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: "800",
            letterSpacing: "0.2px",
            whiteSpace: "nowrap"
          }}>
            Report Ready
          </span>

          {/* Urgent "FREE FOR NOW" Micro-Badge on Sticky Bar */}
          {!hasDownloadedOnce && (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              background: "rgba(34, 197, 94, 0.18)",
              border: "1px solid rgba(74, 222, 128, 0.45)",
              color: "#4ade80",
              fontSize: "9.5px",
              fontWeight: "900",
              padding: "1.5px 7px",
              borderRadius: "999px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              whiteSpace: "nowrap"
            }}>
              ⚡ Free For Now
            </span>
          )}
        </div>

        <span style={{
          color: "#94a3b8",
          fontSize: "11px",
          fontWeight: "500",
          whiteSpace: "nowrap"
        }}>
          15+ Pages • Personalized PDF
        </span>
      </div>
    </div>

   {/* Right Side: Exact Gradient Button with Interactive Unlocking Padlock */}
    <button
      className="sticky-unlock-btn"
      onClick={handleDownloadReport}
      disabled={isGenerating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "9px",
        padding: "12px 24px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #2b59ff 0%, #7d3bf9 100%)",
        border: "none",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "800",
        letterSpacing: "0.2px",
        cursor: isGenerating ? "wait" : "pointer",
        boxShadow: "0 4px 18px rgba(109, 40, 217, 0.48), 0 2px 6px rgba(0, 0, 0, 0.15)",
        flexShrink: 0,
        transition: "all 0.22s ease"
      }}
      onMouseEnter={(e) => {
        if (!isGenerating) {
          e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(125, 59, 249, 0.65)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isGenerating) {
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 18px rgba(109, 40, 217, 0.48), 0 2px 6px rgba(0, 0, 0, 0.15)";
        }
      }}
    >
      {isGenerating ? (
        <>
          <svg
            style={{ animation: "spin 1s linear infinite", width: "16px", height: "16px" }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          {/* Animated SVG Padlock */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            style={{ flexShrink: 0, overflow: "visible", marginBottom: "1px" }}
          >
            {/* Shackle: Pivots from the left socket when button is hovered */}
            <path
              className="lock-shackle"
              d="M7.5 10V6.2a4.5 4.5 0 0 1 9 0V10"
              stroke="#ffffff"
              strokeWidth="2.8"
              strokeLinecap="round"
              style={{
                transformOrigin: "7.5px 10px",
                transition: "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
            {/* Lock Body */}
            <rect x="5" y="9.5" width="14" height="11.5" rx="2.8" fill="#ffffff" />
            
            {/* Embedded Keyhole */}
            <circle cx="12" cy="14.2" r="1.2" fill="#5835e8" />
            <polygon points="11.3,14.5 12.7,14.5 12.9,17.2 11.1,17.2" fill="#5835e8" />
          </svg>

          {hasDownloadedOnce ? "Download Report Again ↓" : "Unlock My Full Report"}
        </>
      )}
    </button>
  </div>
  </div>
  {/* ========================================================= */}
{/* MODERN RECTANGLE POP-UP MODAL (GENERATING & SUCCESS)      */}
{/* ========================================================= */}
{downloadPopupState !== "IDLE" && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(15, 23, 42, 0.6)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      opacity: isPopupFadingOut ? 0 : 1,
      transition: "opacity 0.4s ease-out",
    }}
  >
    {/* Animation Keyframes */}
    <style>
      {`
        @keyframes popupScaleIn {
          0% { opacity: 0; transform: translateY(12px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes msgSlideFade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shimmerProgress {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes checkPop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.12); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}
    </style>

    {/* RECTANGULAR CARD */}
    <div
      style={{
        background: "#ffffff",
        width: "100%",
        maxWidth: "460px",
        borderRadius: "20px",
        padding: "32px 28px",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)",
        textAlign: "center",
        animation: "popupScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {downloadPopupState === "GENERATING" ? (
        <>
          {/* Modern Dual-Ring Spinner */}
          <div
            style={{
              width: "52px",
              height: "52px",
              margin: "0 auto 20px auto",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "4px solid #f1f5f9",
                borderTopColor: "#6a11cb",
                borderRightColor: "#8b5cf6",
                animation: "spinRing 0.9s linear infinite",
              }}
            />
            <span style={{ fontSize: "18px" }}>⚡</span>
          </div>

          {/* Main Title */}
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "20px",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "-0.3px",
            }}
          >
            Generating Your Report
          </h3>

          {/* Rotating 11 Messages Container (Fixed height prevents layout jump) */}
          <div
            style={{
              minHeight: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "22px",
              padding: "0 8px",
            }}
          >
            <p
              key={rotatingMsgIndex}
              style={{
                margin: 0,
                fontSize: "14.5px",
                fontWeight: "600",
                color: "#475569",
                lineHeight: "1.5",
                animation: "msgSlideFade 1.6s ease-in-out forwards",
              }}
            >
              {REPORT_GENERATION_MESSAGES[rotatingMsgIndex]}
            </p>
          </div>

          {/* Smooth Animated Shimmer Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "#f1f5f9",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #6a11cb 0%, #a855f7 50%, #6a11cb 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmerProgress 1.8s infinite linear",
                borderRadius: "999px",
              }}
            />
          </div>

          {/* Subtle Keep-Open Note */}
          <div style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}>
            Please keep this tab open for a few seconds
          </div>
        </>
      ) : (
        /* --- SUCCESS CONFIRMATION RECTANGLE (FADES IN 3s) --- */
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#ecfdf5",
              border: "2px solid #a7f3d0",
              color: "#10b981",
              fontSize: "28px",
              fontWeight: "900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              animation: "checkPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            ✓
          </div>

          <h3
            style={{
              margin: "0 0 6px 0",
              fontSize: "21px",
              fontWeight: "900",
              color: "#0f172a",
              letterSpacing: "-0.3px",
            }}
          >
            Report Downloaded Successfully
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#64748b",
              fontWeight: "600",
            }}
          >
            Saved to your device's Downloads folder
          </p>
        </div>
      )}
    </div>
  </div>
)}

        <style>{`
  @keyframes cta-dock-glow {
    0%, 100% { box-shadow: 0 14px 35px -8px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.12); }
    50% { box-shadow: 0 18px 45px -6px rgba(109, 40, 217, 0.38), 0 0 0 1.5px rgba(167, 139, 250, 0.45); }
  }
  @keyframes live-pulse-dot {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }

  /* Mechanical padlock unlock animation on hover */
  .sticky-unlock-btn:hover .lock-shackle {
    transform: translateY(-3px) rotate(-26deg) !important;
  }
`}</style>

      </div>
    );
  }
  // -------------------- QUESTION PAGE --------------------
  const q = QUESTIONS[step];

  return (<div 
  className="assessment-wrapper" 
  style={{ 
    minHeight: "100vh", 
    background: "#fafafa", 
    padding: "20px 12px",
    paddingBottom: isMobile ? "100px" : "30px" /* Adds clearance so the fixed pill never covers the Next button */
  }}
>
      <Helmet>
        <title>Start Assessment | JEE Society</title>
        <meta name="description" content="Answer 16 questions to analyze your JEE Main & Advanced consistency, focus, and syllabus coverage." />
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
              {/* Question Header & Multi-Select Tag Bar */}
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
  flexWrap: "wrap",
  gap: "8px"
}}>
  {/* Left: Section name & Question Counter */}
  <div style={{ fontSize: "14px", color: "#777", fontWeight: "600" }}>
    {activeSection ? `${activeSection.title} · ` : ""}
    Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
  </div>

  {/* Right: Dynamic Multi-Select Badge (Only displays on multi-select questions) */}
  {q.multi && (
  <div style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px 4px 6px",
    borderRadius: "6px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)"
  }}>
    {/* Clean Geometric Checkbox Icon */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "17px",
      height: "17px",
      borderRadius: "4px",
      background: "#0f172a",
      color: "#ffffff"
    }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>

    {/* Section Label */}
    <span style={{
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: "#0f172a"
    }}>
      Multi-Select
    </span>

    <span style={{ color: "#cbd5e1", fontSize: "11px" }}>•</span>

    {/* Counter Spec */}
    <span style={{
      fontSize: "12px",
      fontWeight: "500",
      color: "#64748b"
    }}>
      Pick up to <strong style={{ color: "#0f172a", fontWeight: "700" }}>{q.maxSelect || 2}</strong>
    </span>
  </div>
)}
</div>

{/* Question Title */}
<h2 style={{
  fontSize: "20px",
  fontWeight: "700",
  marginBottom: "20px",
  color: "#0f172a",
  lineHeight: "1.4"
}}>
  {q.question}
</h2>

{/* INPUTS */}
              {/* INPUTS */}
{q.type === "text" ? (
  <div>
    <input
      type="text"
      value={answers[q.id] || ""}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        width: "100%", padding: "14px", borderRadius: "10px",
        border: "1px solid #ccc", fontSize: "16px", boxSizing: "border-box"
      }}
      placeholder="Type your name..."
    />

    {/* Instructions for Step 0 (Name Question) */}
    {q.id === "name" && (
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px", marginTop: "20px", textAlign: "left" }}>
  <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a", marginBottom: "12px" }}>
    📋 Instructions Before You Begin:
  </div>
  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13.5px", color: "#475569", lineHeight: "1.65" }}>
    <li style={{ marginBottom: "8px" }}>
      You'll be asked 16 questions about your JEE Preparation. Be 100% real with yourself.
    </li>
    <li style={{ marginBottom: "8px" }}>
      At the end you will get a report, print it, and follow it like words of god.
    </li>
  </ul>
</div>
    )}
  </div>
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
  const isMulti = Boolean(q.multi);
  const isSelected = isMulti
    ? Array.isArray(answers[q.id]) && (answers[q.id].includes(String(idx)) || answers[q.id].includes(idx))
    : answers[q.id] == idx;

  return (
    <div
      key={idx}
      onClick={(e) => selectOption(idx, e)}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px 20px",
        borderRadius: "14px",
        cursor: "pointer",
        border: isSelected ? "2px solid #c62828" : "1px solid #e0e0e0",
        background: isSelected ? "#c62828" : "#fff",
        color: isSelected ? "white" : "#000",
        transition: "all 0.25s ease"
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "#f8eaea";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "#fff";
      }}
    >
      {/* Ripple Animation */}
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

      {/* Option Badge: Circle for Single-Select, Rounded Checkbox for Multi-Select */}
      <div
        style={{
          position: "relative",
          minWidth: "24px",
          minHeight: "24px",
          width: "24px",
          height: "24px",
          flexShrink: 0,
          borderRadius: isMulti ? "6px" : "50%",
          border: `2px solid ${isSelected ? "white" : "#bbb"}`,
          background: isSelected && isMulti ? "rgba(255,255,255,0.2)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "900",
          fontSize: isMulti && isSelected ? "15px" : "14px",
          fontFamily: "Arial",
          lineHeight: "1",
          animation: pulseIdx === idx ? "badge-pop 0.35s ease" : "none",
        }}
      >
        {isMulti && isSelected ? "✓" : String.fromCharCode(65 + idx)}
      </div>

      <div style={{ position: "relative", fontSize: "16px", lineHeight: "1.45" }}>
        {opt}
      </div>
    </div>
  );
})}
                </div>
              )}

              {/* Place this right after the closing </div> of q.options.map */}
{!q.multi ? (
  <p style={{
    fontSize: "12.5px",
    color: "#94a3b8",
    marginTop: "16px",
    fontStyle: "italic",
    textAlign: "center"
  }}>
    If more than one option feels 100% correct, choose the closest one — the model is designed to adjust for that.
  </p>
) : (
  <p style={{
    fontSize: "12.5px",
    color: "#b91c1c",
    marginTop: "16px",
    fontWeight: "600",
    textAlign: "center"
  }}>
    Select up to {q.maxSelect || 2} options that genuinely describe your situation.
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

// Custom Checkout & Lead Modal Component
function ReportCheckoutModal({ isOpen, onClose, onConfirm, studentName, isFreePromo = false, isGenerating = false }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState(studentName || "");
  const [error, setError] = useState("");

  // Sync incoming studentName if it updates from Question 1
  useEffect(() => {
    if (studentName) setName(studentName);
  }, [studentName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit WhatsApp number.");
      return;
    }
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onConfirm({ name, phone: cleanPhone, email });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl text-white">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          disabled={isGenerating}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-full mb-2">
            {isFreePromo ? "Special Free Access" : "Official Diagnostic Report"}
          </span>
          <h3 className="text-2xl font-black text-white">Finalize Your Access</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Where should we send your official PDF audit & tracker sheets?
          </p>
        </div>

        {/* Pricing Box */}
        <div className="flex items-center justify-between p-4 mb-5 rounded-2xl bg-zinc-800/80 border border-zinc-700">
          <div>
            <div className="text-xs text-zinc-400 uppercase font-semibold">Total Investment</div>
            <div className="text-xl font-black text-white">
              {isFreePromo ? (
                <span className="text-emerald-400">FREE <span className="text-xs text-zinc-500 line-through">₹499</span></span>
              ) : (
                <span>₹99 <span className="text-xs text-zinc-500 line-through">₹499</span></span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {isFreePromo ? "100% OFF" : "80% DISCOUNT"}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Aspirant Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              WhatsApp Mobile Number
            </label>
            <input 
              type="tel" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white font-medium focus:outline-none focus:border-red-500 transition-colors"
              placeholder="you@gmail.com"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 font-semibold">{error}</p>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3.5 mt-2 rounded-xl font-extrabold text-sm uppercase tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 shadow-lg shadow-red-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Generating Your Official Audit...
              </>
            ) : isFreePromo ? (
              "Claim Free Report & Download"
            ) : (
              "Pay ₹99 & Download Instant Report"
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-zinc-500 mt-4">
          🔒 Secure 256-bit encrypted checkout. Instant PDF delivery.
        </p>
      </div>
    </div>
  );
}

// --- 3D FLIP TESTIMONIALS COMPONENT ---
const TestimonialCards = () => {
  const [flippedCards, setFlippedCards] = useState({});

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const testimonials = [
    {
      id: "ayush",
      name: "Ayush K.",
      college: "IIT Roorkee (ECE)",
      avatarBg: "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)",
      badge: "Oct: 84 Marks ➔ April: 99.2%ile",
      hook: "Trapped in Class 11 backlog. Was watching 6-hour one-shots every single day that produced exactly 0 mock improvement.",
      story: "It was mid-October when I hit rock bottom at 84 marks. The diagnostic audit forced me to stop passive video bingeing and gave me a ruthless 4-chapter PYQ filter. Jumped to 218 in April and scored 182 in Advanced (AIR 2,300+).",
      takeaway: "“Stop watching lectures. Solve 15 PYQs from your weakest units before touching anything new.”"
    },
    {
      id: "tanmay",
      name: "Tanmay S.",
      college: "IIT Kharagpur (Mechanical)",
      avatarBg: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
      badge: "-36 Negatives ➔ AIR 3,100+",
      hook: "Losing 36+ marks in every mock purely to silly mistakes and time panic. Teachers said 'focus more'—which helped nothing.",
      story: "In October, test anxiety was silently sabotaging my score. The R.E.F breakdown showed my problem wasn't knowledge; it was test discipline. I hung the 90-day error grid over my desk. By April, my accuracy hit 89% and I cleared Advanced with AIR 3,100+.",
      takeaway: "“Categorizing errors into Silly vs Conceptual saves more marks than opening a new textbook.”"
    },
    {
      id: "harshit",
      name: "Harshit V.",
      college: "IIT Kanpur (Chemical)",
      avatarBg: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      badge: "Chem: 22/100 ➔ 99.42%ile",
      hook: "Scoring just 22 in Chemistry. Reactions vanished from memory 3 days after studying. Was ready to give up on JEE completely.",
      story: "By late October, Chemistry felt hopeless. The audit flagged my 'leaky-bucket' revision habits and put me on a fixed Day 1-3-7 recall cycle. Chemistry alone surged from 22/100 to 78/100 in April Mains, carrying me straight into IIT Kanpur.",
      takeaway: "“Fixed-interval revision beats re-reading chapters from scratch every single time.”"
    }
  ];

  return (
    <div style={{ marginTop: "32px", marginBottom: "40px" }}>
      <style>{`
        .flip-card-container {
          perspective: 1000px;
          height: 250px;
          cursor: pointer;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card-container:hover .flip-card-inner,
        .flip-card-inner.is-flipped {
          transform: rotateY(180deg);
        }
        .flip-face {
          position: absolute;
          inset: 0;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0,0,0,0.04);
        }
        .flip-front {
          background: #ffffff;
        }
        .flip-back {
          background: #0f172a;
          color: #f8fafc;
          transform: rotateY(180deg);
          border-color: #334155;
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "12px", fontWeight: "800", color: "#6a11cb", letterSpacing: "1px", textTransform: "uppercase" }}>
          Real Student Turnarounds
        </div>
        <h4 style={{ margin: "4px 0 0 0", fontSize: "20px", fontWeight: "900", color: "#0f172a" }}>
          From Rock Bottom in October to Top IITs
        </h4>
        <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "4px" }}>
          (Tap or hover on any card to flip and read their story)
        </div>
      </div>

      {/* 3D Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px"
      }}>
        {testimonials.map((t) => {
          const isFlipped = !!flippedCards[t.id];
          return (
            <div
              key={t.id}
              className="flip-card-container"
              onClick={() => toggleFlip(t.id)}
            >
              <div className={`flip-card-inner ${isFlipped ? "is-flipped" : ""}`}>
                
                {/* --- FRONT SIDE --- */}
                <div className="flip-face flip-front">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: t.avatarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "900", color: "#0f172a" }}>{t.name}</div>
                        <div style={{ fontSize: "12.5px", fontWeight: "800", color: "#6a11cb" }}>{t.college}</div>
                      </div>
                    </div>

                    <div style={{
                      display: "inline-block",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: "11.5px",
                      fontWeight: "800",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      marginBottom: "10px"
                    }}>
                      {t.badge}
                    </div>

                    <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.5", fontWeight: "600" }}>
                      "{t.hook}"
                    </p>
                  </div>

                  <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#6a11cb", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Flip to see how ➔</span>
                  </div>
                </div>

                {/* --- BACK SIDE --- */}
                <div className="flip-face flip-back">
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                      How {t.name} Turned It Around:
                    </div>
                    <p style={{ margin: "0 0 8px 0", fontSize: "12.5px", color: "#cbd5e1", lineHeight: "1.5" }}>
                      {t.story}
                    </p>
                    <div style={{ fontSize: "12px", color: "#facc15", fontWeight: "700", fontStyle: "italic", lineHeight: "1.35" }}>
                      {t.takeaway}
                    </div>
                  </div>

                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>Tap to flip back ↻</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};