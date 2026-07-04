import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./landing.css";

// --- COMPONENTS FOR TESTIMONIALS ---

const YouTubeComment = ({ name, content, avatar, time }) => (
  <div className="youtube-card">
    <div className="yt-header">
      <div className="yt-avatar">{avatar}</div>
      <div className="yt-info">
        <div className="yt-name-row">
          <span className="yt-name">{name}</span>
          <span className="yt-time">{time}</span>
        </div>
        <p className="yt-content">{content}</p>
        <div className="yt-actions">
          <div className="yt-likes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            <span>{Math.floor(Math.random() * 50) + 10}</span>
          </div>
          <span className="yt-reply">Reply</span>
        </div>
      </div>
    </div>
  </div>
);

const WhatsAppMessage = ({ name, content, avatar, time }) => (
  <div className="whatsapp-card">
    <div className="wa-avatar">{avatar}</div>
    <div className="wa-body">
      <div className="wa-name">{name}</div>
      <p className="wa-content">{content}</p>
      <div className="wa-meta">
        <span className="wa-time">{time}</span>
        <svg className="wa-ticks" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          <path d="M15.5 6.5L14 5 8.5 10.5l1.5 1.5 5.5-5.5z"/>
        </svg>
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
        <a 
          href="https://www.youtube.com/@SreyashBhaiyaIITB" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="yt-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          YouTube
        </a>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            IS JEE <br/>
            <span className="hero-highlight">STILL POSSIBLE?</span>
          </h1>
          <h2 className="hero-subtitle">In just 5 minutes, get a data-backed roadmap that shows your real standing, predicted rank, and what exactly you are doing wrong</h2>
          
          
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

      {/* --- TESTIMONIALS (MARQUEE) --- */}
      <section className="testimonials-section">
        <div style={{ textAlign: "center" }}>
          <span className="section-badge" style={{ background: "#e0e7ff", color: "#4338ca" }}>Real Student Feedback</span>
          <h2 className="section-title">What Aspirants Are Saying</h2>
        </div>

        <div className="scroll-container">
          {/* Loop twice for infinite scroll effect */}
          {[...testimonials, ...testimonials].map((t, i) => (
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

      {/* --- FEATURES --- */}
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
            <h3 className="f-title">Accurate Percentile Prediction</h3>
            <p className="f-desc">Our algorithm compares your habits against successful IITians to predict your realistic rank range (Expected Percentile & Potential Percentile).</p>
          </div>
          <div className="feature-card">
            <div className="icon-box icon-orange">📋</div>
            <h3 className="f-title">A Personalized Action Plan</h3>
            <p className="f-desc">Know your exact weaknesses. Get specific guidelines to fix
your weaknesses immediately.</p>
          </div>
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