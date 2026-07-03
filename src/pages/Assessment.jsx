import React, { useState } from "react";
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
  }
];

// --- HELPER COMPONENT: (Upgraded with auto-wrapping text) ---
const CircularScore = ({ value, max = 100, color, title, rangeText }) => {
  const radius = 70; 
  const strokeWidth = 12; 
  const size = 180; 
  const center = size / 2;
  
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

  // Smart Font Size: Large for "JSS", smaller for "Potential Percentile"
  const titleFontSize = title.length > 5 ? "16px" : "28px";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
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
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
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
            {rangeText}
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

export default function StudentSwotForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showSWOT, setShowSWOT] = useState(false);
  const [finalSWOT, setFinalSWOT] = useState({ S: "", W: "", O: "", T: "" });
  
  // --- NEW: Replaced email states with a single generating state ---
  const [isGenerating, setIsGenerating] = useState(false);

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
  const TOTAL_QUESTIONS = 18;
  const currentQuestionIndex = Math.max(step - 1, 0); 
  const progressPercent = Math.min(
    Math.round((currentQuestionIndex / TOTAL_QUESTIONS) * 100),
    100
  );

  const handleChange = (value) => {
    setAnswers({ ...answers, [QUESTIONS[step].id]: value });
  };

  const next = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
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

  const submit = () => calculateSWOT();

  // --------------------------------------------------------
  // HANDLE DIRECT PDF DOWNLOAD (Admin Workflow)
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

  // ---------------- RENDER: RESULTS PAGE (ADMIN DASHBOARD) ----------------
  if (showSWOT) {
    const scores = computeScores(answers);
    const { jee_society_score } = scores;

    const attemptIndex = answers["q17"];
    const attemptLabel = QUESTIONS.find(q => q.id === "q17").options[attemptIndex] || "JEE Main";

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
      <div className="swot-container">
        <h2 style={{ marginBottom: "10px", fontSize: "28px" }}>Admin Performance Summary</h2>
        
        <div style={{ marginBottom: "40px", color: "#666", fontSize: "18px", background: "#f1f1f1", display: "inline-block", padding: "8px 20px", borderRadius: "20px" }}>
          Target: <strong>{attemptLabel}</strong>
        </div>
        
        {/* --- ONLY ROW: JSS --- */}
        <div style={{ ...rowStyle, gap: "35px", marginTop: "20px", marginBottom: "45px" }}>
           <div style={{ flex: "0 0 auto", transform: "scale(1.12)", transformOrigin: "center", zIndex: 1 }}>
              <CircularScore value={jee_society_score} color="#6a11cb" title="JSS" rangeText={jee_society_score} />
           </div>
           
           <div style={{ 
             ...boxStyle("#6a11cb", "#f8f9fa"), 
             padding: "22px 25px", 
             borderLeft: "7px solid #6a11cb" 
           }}>
             <h3 style={{ margin: "0 0 8px 0", color: "#6a11cb", fontSize: "22px" }}>JSS (JEEsociety Score)</h3>
             <p style={{ margin: 0, fontSize: "15px", color: "#333", lineHeight: "1.65" }}>
               This is your <b>Holistic Preparation Index</b>. Unlike a mock test that only checks knowledge, JSS accounts for your Consistency, Focus, Revision Quality, and Syllabus Coverage.
             </p>
           </div>
        </div>

        {/* --- SWOT SECTION --- */}
        <h2 style={{ marginTop: "50px" }}>Your Strength & Weakness</h2>
        <div className="swot-box strength"><b>Strength:</b> {finalSWOT.S}</div>
        <div className="swot-box weakness"><b>Weakness:</b> {finalSWOT.W}</div>

        {/* --- CLEAN ADMIN ACTION SECTION --- */}
        <div style={{ marginTop: "60px", minHeight: "150px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ 
            fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif", 
            fontSize: "26px", 
            fontWeight: "800", 
            letterSpacing: "-0.5px", 
            marginBottom: "30px",
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent", 
            textShadow: "0px 4px 15px rgba(124, 58, 237, 0.15)",
            lineHeight: "1.3"
          }}>
            Admin Dashboard Actions
          </h3>
          
          <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleDownloadReport}
              disabled={isGenerating}
              style={{
                padding: "14px 32px", borderRadius: "12px",
                background: isGenerating ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #7c3aed)",
                color: "white", fontSize: "18px", fontWeight: "bold", border: "none",
                cursor: isGenerating ? "not-allowed" : "pointer", transition: "0.2s ease",
                boxShadow: isGenerating ? "none" : "0 8px 20px rgba(124, 58, 237, 0.35)",
              }}
              onMouseEnter={(e) => { if(!isGenerating) e.target.style.transform = "scale(1.05)"; }}
              onMouseLeave={(e) => { if(!isGenerating) e.target.style.transform = "scale(1)"; }}
            >
              {isGenerating ? "Generating PDF..." : "📥 Generate & Download PDF"}
            </button>
            
            <button
              onClick={() => window.open("/sample-report.pdf", "_blank")}
              style={{
                padding: "14px 32px", borderRadius: "12px",
                background: "#1e90ff", color: "white", fontSize: "16px", fontWeight: "bold",
                border: "none", cursor: "pointer", transition: "0.2s ease",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              }}
              onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
            >
              View Sample Report
            </button>
          </div>
        </div>

        {/* --- YOUTUBE BUTTON --- */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
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
        
        {/* Report Content Details */}
        <details style={{ marginTop: "30px", marginBottom: "30px", textAlign: "center", cursor: "pointer" }}>
          <summary style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px", outline: "none" }}>
            What will your report contain?
          </summary>
          <ul style={{ display: "inline-block", textAlign: "left", maxWidth: "550px", paddingLeft: "20px", lineHeight: "1.8", color: "#555" }}>
              <li><strong>Detailed SWOT Snapshot:</strong> Deep dive into your Strengths, Weaknesses, Opportunities, and Threats.</li>
              <li><strong>Health & Environment Audit:</strong> Analysis of your physical stamina and study space.</li>
              <li><strong>Key Barriers:</strong> Identifying the specific root causes holding you back.</li>
              <li><strong>Personalized Strategy:</strong> A tailored roadmap and recommendations to improve your score.</li>
            </ul>
        </details>

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
        <meta name="description" content="Answer 18 questions to analyze your JEE Main & Advanced consistency, focus, and syllabus coverage." />
        <link rel="canonical" href="https://report.jeesociety.in/assessment" />
        <meta name="robots" content="noindex" /> {/* Optional: Keep Google away from the quiz questions directly? Usually yes. */}
      </Helmet>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
            <div style={{ fontSize: "14px", color: "#999" }}>{progressPercent}% Complete</div>
          </div>

          {/* Progress Header */}
          <div style={{ marginBottom: "25px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "#777", marginBottom: "8px" }}>
              <span>Question {Math.min(currentQuestionIndex + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</span>
              <span>{progressPercent}%</span>
            </div>
            <div style={{ height: "6px", background: "#eee", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPercent}%`, background: "#c62828", transition: "width 0.4s ease" }} />
            </div>
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
              {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] == idx;
                return (
                  <div
                    key={idx}
                    onClick={() => handleChange(idx)}
                    style={{
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
                    <div style={{
                      minWidth: "24px", minHeight: "24px", width: "24px", height: "24px",
                      flexShrink: 0, borderRadius: "50%",
                      border: `2px solid ${isSelected ? "white" : "#bbb"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "900", fontSize: "14px", fontFamily: "Arial", lineHeight: "1"
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div style={{ fontSize: "16px", lineHeight: "1.45" }}>{opt}</div>
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
              onClick={step === QUESTIONS.length - 1 ? submit : next}
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

        </div>
      </div>
    </div>
  );
}