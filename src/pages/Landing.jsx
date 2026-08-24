import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./landing.css";

// --- COMPONENTS FOR TESTIMONIALS ---

// --- UPDATED YOUTUBE COMMENT COMPONENT ---
const YouTubeComment = ({ name, content, avatar, time }) => (
  <div className="yt-card-v2">
    <div className="yt-pill-tag">
      <span className="yt-play-icon">▶</span> YOUTUBE COMMENT
    </div>
    <div className="yt-user-row">
      <div className="yt-avatar-circle">{avatar}</div>
      <div className="yt-user-meta">
        <span className="yt-user-name">{name}</span>
        <span className="yt-time-ago">{time}</span>
      </div>
    </div>
    <p className="yt-comment-text">{content}</p>
    <div className="yt-card-footer">
      <span className="yt-like-btn">👍 {Math.floor(Math.random() * 40) + 12}</span>
      <span className="yt-reply-btn">Reply</span>
    </div>
  </div>
);

// --- UPDATED WHATSAPP MESSAGE COMPONENT ---
const WhatsAppMessage = ({ name, content, avatar, time }) => (
  <div className="wa-card-v2">
    <div className="wa-header-bar">
      <div className="wa-header-avatar">{avatar}</div>
      <span className="wa-header-name">{name}</span>
    </div>
    <div className="wa-bubble-body">
      <p className="wa-message-text">{content}</p>
      <div className="wa-time-row">
        <span className="wa-time-text">{time}</span>
        <span className="wa-blue-ticks">✓✓</span>
      </div>
    </div>
  </div>
);

// --- REPORT DECK: replace these with your actual screenshot filenames ---
// width/height = the real pixel dimensions of each file, used to size
// each card to its own exact aspect ratio (no cropping, no white bars).
const REPORT_IMAGES = [
  { src: "/report-1.png", alt: "JEE Performance Report - Percentile Overview", width: 1024, height: 1536 },
  { src: "/report-2.png", alt: "JEE Performance Report - SWOT Analysis", width: 1122, height: 1402 },
  { src: "/report-3.png", alt: "JEE Performance Report - Personalized Action Plan", width: 1024, height: 1536 },
  { src: "/report-4.png", alt: "JEE Performance Report - Rank Prediction", width: 1024, height: 1536 },
  { src: "/report-5.png", alt: "JEE Performance Report - Execution Guidelines", width: 1024, height: 1536 },
];

const AUTO_CYCLE_MS = 4000;

const ReportDeck = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const resumeTimeoutRef = useRef(null);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % REPORT_IMAGES.length);
    }, AUTO_CYCLE_MS);
    return () => clearInterval(timerRef.current);
  }, [isPaused]);

  const handleDotClick = (index) => {
    setActiveIndex(index);
    setIsPaused(true);
    clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => setIsPaused(false), 6000);
  };

  // Compute each card's position relative to the active card
  // so the "front" card is always centered and others fan out behind it.
  const getCardStyle = (index) => {
    const total = REPORT_IMAGES.length;
    let offset = index - activeIndex;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    const absOffset = Math.abs(offset);
    const aspectRatio = `${REPORT_IMAGES[index].width} / ${REPORT_IMAGES[index].height}`;

    if (absOffset === 0) {
      return {
        aspectRatio,
        transform: "translate(-50%, -50%) translateY(0) rotate(0deg) scale(1)",
        zIndex: 50,
        opacity: 1,
        filter: "none",
      };
    }

    const direction = offset > 0 ? 1 : -1;
    const depth = Math.min(absOffset, 3);

    return {
      aspectRatio,
      transform: `translate(-50%, -50%) translate(${direction * depth * 26}px, ${depth * 14}px) rotate(${direction * depth * 6}deg) scale(${1 - depth * 0.08})`,
      zIndex: 50 - depth,
      opacity: depth > 2 ? 0 : 1 - depth * 0.22,
      filter: `blur(${depth * 0.4}px)`,
    };
  };

  return (
    <div
      className="report-deck"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="report-deck-stage">
        {REPORT_IMAGES.map((img, index) => (
          <div
            key={img.src}
            className={`report-card ${index === activeIndex ? "report-card-active" : ""}`}
            style={getCardStyle(index)}
          >
            <img src={img.src} alt={img.alt} draggable="false" />
          </div>
        ))}
      </div>

      <div className="report-deck-dots">
        {REPORT_IMAGES.map((_, index) => (
          <button
            key={index}
            className={`report-dot ${index === activeIndex ? "report-dot-active" : ""}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Show report snapshot ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();

  return (
    // ✅ SCOPED CLASS HERE: Matches the new CSS
    <div className="landing-wrapper">
      <Helmet>
        <title>JEE Readiness Assessment 2026 | Free AI Analysis Report</title>
        <meta name="description" content="Is your JEE preparation on track? Take this free 2-minute diagnostic test used by toppers to check your predicted percentile and get a SWOT analysis." />
      </Helmet>

      {/* --- NAVBAR --- */}
<nav className="navbar">
  <div className="nav-brand">
    <img src="/JEEsociety_logo.png" alt="Logo" className="nav-logo" />
    <span>JEE<span style={{ color: "#c62828" }}>society</span></span>
  </div>

  <div className="nav-actions">
    {/* WhatsApp Button */}
    <a 
      href="https://whatsapp.com/channel/0029VbDZ6FnGE56sPOiSVL0a" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="wa-btn"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
      </svg>
      <span>WhatsApp</span>
    </a>

    {/* YouTube Button */}
    <a 
      href="https://www.youtube.com/@SreyashBhaiyaIITB" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="yt-btn"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
      </svg>
      <span>YouTube</span>
    </a>
  </div>
</nav>

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            IS JEE <br/>
            <span className="hero-highlight">STILL POSSIBLE?</span>
          </h1>
          <h2 className="hero-subtitle">In just 5 minutes, get a data-backed roadmap that shows your real standing, hidden score leaks, exact plan, and what exactly you are doing wrong</h2>
          
          
          <button onClick={() => navigate("/assessment")} className="cta-main">
            Check Your Probability &rarr;
          </button>
          
          <div style={{ marginTop: "20px", fontSize: "14px", color: "#888", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Takes only 5 minutes
          </div>
        </div>

        <div className="hero-visual-container">
          <ReportDeck />
        </div>
      </section>

      {/* --- FEATURES (WHY IT WORKS FIRST) --- */}
      <section className="features-section">
        <span className="section-badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>Why It Works</span>
        <h2 className="section-title">
          Why <span className="hero-highlight">10,000+ Serious Aspirants</span><br/>
          Trust This Diagnostic
        </h2>
        <p style={{ maxWidth: "600px", margin: "0 auto", color: "#64748b" }}>
          Our data-driven approach goes deeper than any mock test to reveal your true JEE readiness.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-box icon-purple">🧠</div>
            <h3 className="f-title">Beyond Mock Scores</h3>
            <p className="f-desc">We analyze hidden factors like consistency, focus depth, and syllabus coverage - not just your knowledge.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box icon-green">📊</div>
            <h3 className="f-title">A Realistic Rank Reality Check</h3>
            <p className="f-desc">A single mock score is a misleading snapshot. We map your preparation against real NTA trends and rank-holder data to give you your true predicted range.
</p>
          </div>
          <div className="feature-card">
            <div className="icon-box icon-orange">📋</div>
            <h3 className="f-title">A Personalized Action Plan</h3>
            <p className="f-desc">Know your exact weaknesses. Get specific guidelines to fix your weaknesses immediately.</p>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS (MOVED AFTER WHY IT WORKS, NO AUTO SCROLL) --- */}
      <section className="testimonials-section">
        <div style={{ textAlign: "center" }}>
          <span className="section-badge" style={{ background: "#e0e7ff", color: "#4338ca" }}>Real Student Feedback</span>
          <h2 className="section-title">What Aspirants Are Saying</h2>
        </div>

        <div className="testimonials-static-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-wrapper">
              {t.type === "youtube" ? (
                <YouTubeComment {...t} />
              ) : (
                <WhatsAppMessage {...t} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* --- DARK CTA --- */}
      <section className="dark-cta-section">
        <div className="glow-icon">✨</div>
        <h2 className="dark-title">
          The Gap Between a <span className="text-orange">Dreamer</span><br/>
          and an <span className="text-green">IITian</span> is Clarity.
        </h2>
        <p className="dark-subtitle">
          Don't waste another week confused. Get your reality check today.
        </p>
        
        {/* ✅ UPDATED SHIMMER BUTTON */}
        <button onClick={() => navigate("/assessment")} className="shimmer-btn">
          {/* Spark Container */}
          <div className="shimmer-spark-container">
            <div className="shimmer-spark">
              <div className="shimmer-spark-inner" />
            </div>
          </div>
          
          {/* Backdrop */}
          <div className="shimmer-backdrop" />
          
          {/* Highlight */}
          <div className="shimmer-highlight" />
          
          {/* Text Content */}
          <span className="shimmer-text">
            Get My Free Detailed Report &rarr;
          </span>
        </button>
      </section>

      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="nav-brand" style={{ fontSize: "18px" }}>
          <img src="/JEEsociety_logo.png" alt="Logo" className="nav-logo" style={{height:"30px", width:"30px"}} />
          <span>JEE<span style={{ color: "#c62828" }}>society</span></span>
          <span style={{ fontSize: "12px", color: "#999", marginLeft: "10px", fontWeight: "400" }}>© 2026 JEEsociety. All rights reserved.</span>
        </div>
        
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="https://www.youtube.com/@SreyashBhaiyaIITB" target="_blank" className="footer-link">YouTube</a>
        </div>
        
        <div style={{ width: "100%", textAlign: "center", marginTop: "30px", fontSize: "12px", color: "#999" }}>
          Built with ❤️ for JEE Aspirants across India
        </div>
      </footer>
    </div>
  );
};

// --- DATA: Testimonials ---
const testimonials = [
  {
    type: "youtube",
    name: "Raghav M***",
    content: "Sreyash bhaiya, that JSS score was a reality check. Changed my whole strategy for Chem. 🔥",
    avatar: "RM",
    time: "2 weeks ago",
  },
  {
    type: "whatsapp",
    name: "Arjun K***",
    content: "Sir, the report accurately predicted I was wasting time on lectures. The consistency meter was spot on 💯",
    avatar: "AK",
    time: "Yesterday",
  },
  {
    type: "youtube",
    name: "Priya S***",
    content: "Finally a tool that doesn't just give a mock test score but tells you WHY you are stuck. This is gold!",
    avatar: "PS",
    time: "1 month ago",
  },
  {
    type: "whatsapp",
    name: "Rahul V***",
    content: "My PP percentile was 85-88% but EP was 70-75%. Now I know exactly what to fix before mains 🎯",
    avatar: "RV",
    time: "3 days ago",
  },
  {
    type: "youtube",
    name: "Ananya R***",
    content: "The action plan section alone is worth more than any coaching advice I've received. Subscribed! 🙌",
    avatar: "AR",
    time: "3 weeks ago",
  },
  {
    type: "whatsapp",
    name: "Vikash P***",
    content: "Showed my report to parents. They finally understand why I need to change my study approach",
    avatar: "VP",
    time: "5 hours ago",
  },
  {
    type: "youtube",
    name: "Neha G***",
    content: "From 45 to 78 JSS score in 2 months just by following the execution guidelines. Insane results! 📈",
    avatar: "NG",
    time: "1 week ago",
  },
  {
    type: "whatsapp",
    name: "Amit S***",
    content: "Bhaiya the SWOT analysis exposed my weakness in organic. Working on it now 💪",
    avatar: "AS",
    time: "Just now",
  },
];

export default Landing;