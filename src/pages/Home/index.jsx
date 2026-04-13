import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">

      {/* HERO */}
      <section className="hero">
        <div className="hero-trust">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4H13l-3.5 2.5 1.3 4L7 9.2 3.2 11.5l1.3-4L1 5h4.5z" fill="#5b4fcf" /></svg>
          <span className="hero-trust-txt">Trusted by 50,000+ students across India</span>
        </div>
        <div className="hero-h1">Predict Your College<br /><span>Admission Success</span></div>
        <div className="hero-sub">Get accurate admission predictions, explore colleges, and make informed decisions with our AI-powered platform designed for engineering aspirants.</div>
        <div className="hero-ctas">
          <Link to="/login">
            <button className="cta-primary">
              Start Predicting Now
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </Link>
          <Link to="/college-search-filter">
            <button className="cta-secondary">Explore Colleges</button>
          </Link>
        </div>
        <div className="hero-stats">
          <div className="hstat"><div className="hstat-val">50K+</div><div className="hstat-lbl">Active students</div></div>
          <div className="hstat"><div className="hstat-val">1000+</div><div className="hstat-lbl">Colleges listed</div></div>
          <div className="hstat"><div className="hstat-val">95%</div><div className="hstat-lbl">Accuracy rate</div></div>
          <div className="hstat"><div className="hstat-val">24/7</div><div className="hstat-lbl">Support available</div></div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="sec">
        <div className="sec-center">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="sec-label">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.2 3.5H11L8.4 6.4l1 3L6 7.8l-3.4 1.6 1-3L1 4.5h3.8z" fill="#5b4fcf" /></svg>
              <span className="sec-label-txt">Platform features</span>
            </div>
          </div>
          <div className="sec-h" style={{ marginTop: '10px' }}>Powerful Features for<br />Smarter Decisions</div>
          <div className="sec-sub">Everything you need to make the best admission decision for your engineering future</div>
        </div>
        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#ede9fe' }}>
              <Icon name="Target" size={22} className="text-indigo-600" />
            </div>
            <div className="feat-title">AI-powered predictions</div>
            <div className="feat-desc">Get accurate admission predictions based on your rank, preferences, and historical JEE/EAPCET data.</div>
            <span className="feat-tag">AI engine</span>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#e0f2fe' }}>
              <Icon name="Search" size={22} className="text-sky-600" />
            </div>
            <div className="feat-title">Smart college search</div>
            <div className="feat-desc">Find the perfect college with advanced filters and comprehensive search options across all states.</div>
            <span className="feat-tag" style={{ background: '#e0f2fe', color: '#0284c7' }}>1000+ colleges</span>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#dcfce7' }}>
              <Icon name="BarChart3" size={22} className="text-green-600" />
            </div>
            <div className="feat-title">Detailed analytics</div>
            <div className="feat-desc">Compare colleges, analyse cutoffs, fees, placements, and make informed decisions with rich charts.</div>
            <span className="feat-tag" style={{ background: '#dcfce7', color: '#16a34a' }}>Live data</span>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#fef3c7' }}>
              <Icon name="Bookmark" size={22} className="text-amber-600" />
            </div>
            <div className="feat-title">Save & compare</div>
            <div className="feat-desc">Bookmark your favourite colleges and compare them side-by-side to make the best choice for your career.</div>
            <span className="feat-tag" style={{ background: '#fef3c7', color: '#d97706' }}>Shortlisting</span>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#fce7f3' }}>
              <Icon name="TrendingUp" size={22} className="text-pink-600" />
            </div>
            <div className="feat-title">Cutoff trends</div>
            <div className="feat-desc">Track cutoff trends over years to understand admission patterns and plan your strategy better.</div>
            <span className="feat-tag" style={{ background: '#fce7f3', color: '#db2777' }}>Year-on-year</span>
          </div>
          <div className="feat-card">
            <div className="feat-icon" style={{ background: '#e0f2fe' }}>
              <Icon name="Users" size={22} className="text-sky-600" />
            </div>
            <div className="feat-title">Community insights</div>
            <div className="feat-desc">Read reviews and get insights from students who have been there before — real experiences, real data.</div>
            <span className="feat-tag" style={{ background: '#e0f2fe', color: '#0284c7' }}>Peer reviews</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="sec hiw-bg">
        <div className="sec-center">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="sec-label">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#5b4fcf" stroke-width="1.2" /><path d="M6 4v2.5M6 8v.5" stroke="#5b4fcf" stroke-width="1.2" stroke-linecap="round" /></svg>
              <span className="sec-label-txt">Simple process</span>
            </div>
          </div>
          <div className="sec-h" style={{ marginTop: '10px' }}>How It Works</div>
          <div className="sec-sub">Three simple steps to unlock your personalised admission predictions</div>
        </div>
        <div className="hiw-grid">
          <div className="hiw-card">
            <div className="hiw-num">01</div>
            <div className="hiw-step-badge">1</div>
            <div className="hiw-icon">
              <Icon name="User" size={22} color="white" />
            </div>
            <div className="hiw-title">Enter your details</div>
            <div className="hiw-desc">Provide your rank, exam type, category, and preferred branches to personalise your experience.</div>
          </div>
          <div className="hiw-card">
            <div className="hiw-num">02</div>
            <div className="hiw-step-badge">2</div>
            <div className="hiw-icon">
              <Icon name="Zap" size={22} color="white" />
            </div>
            <div className="hiw-title">Get predictions</div>
            <div className="hiw-desc">Our AI analyses thousands of data points to predict your admission chances across top colleges.</div>
          </div>
          <div className="hiw-card">
            <div className="hiw-num">03</div>
            <div className="hiw-step-badge">3</div>
            <div className="hiw-icon">
              <Icon name="CheckCircle" size={22} color="white" />
            </div>
            <div className="hiw-title">Make decisions</div>
            <div className="hiw-desc">Compare colleges, check cutoffs, fees, and placements to make confident, informed choices.</div>
          </div>
        </div>
      </section>

      {/* EXAM COVERAGE */}
      <section id="exams" className="sec">
        <div className="sec-center">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="sec-label">
              <Icon name="BookOpen" size={12} className="text-indigo-600" />
              <span className="sec-label-txt">Exam coverage</span>
            </div>
          </div>
          <div className="sec-h" style={{ marginTop: '10px' }}>All Major Engineering Exams<br />Covered</div>
          <div className="sec-sub">Comprehensive support for every major engineering entrance exam across India</div>
        </div>
        <div className="exams-grid">
          <div className="exam-card">
            <div className="exam-logo" style={{ background: '#ede9fe', color: '#5b4fcf' }}>JEE</div>
            <div className="exam-name">JEE Main</div>
            <div className="exam-meta">National · All India</div>
            <div className="exam-colleges"><Icon name="GraduationCap" size={12} className="mr-1" />1500+ colleges</div>
          </div>
          <div className="exam-card">
            <div className="exam-logo" style={{ background: '#e0f2fe', color: '#0284c7' }}>JEE</div>
            <div className="exam-name">JEE Advanced</div>
            <div className="exam-meta">IITs · Premier</div>
            <div className="exam-colleges"><Icon name="GraduationCap" size={12} className="mr-1" />23 IITs</div>
          </div>
          <div className="exam-card">
            <div className="exam-logo" style={{ background: '#dcfce7', color: '#16a34a' }}>AP</div>
            <div className="exam-name">AP EAPCET</div>
            <div className="exam-meta">Andhra Pradesh</div>
            <div className="exam-colleges"><Icon name="GraduationCap" size={12} className="mr-1" />300+ colleges</div>
          </div>
          <div className="exam-card">
            <div className="exam-logo" style={{ background: '#fef3c7', color: '#d97706' }}>AP</div>
            <div className="exam-name">AP ECET</div>
            <div className="exam-meta">Andhra Pradesh</div>
            <div className="exam-colleges"><Icon name="GraduationCap" size={12} className="mr-1" />300+ colleges</div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="stories" className="sec hiw-bg">
        <div className="sec-center">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="sec-label">
              <Icon name="MessageSquare" size={12} className="text-indigo-600" />
              <span className="sec-label-txt">Student stories</span>
            </div>
          </div>
          <div className="sec-h" style={{ marginTop: '10px' }}>Students Who Made It</div>
          <div className="sec-sub">Real results from real students who used Counselling Assistant to secure their dream college</div>
        </div>
        <div className="test-grid">
          <div className="test-card">
            <div className="test-stars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="test-star" style={{ width: '14px', height: '14px', background: '#5b4fcf', borderRadius: '3px' }}></div>
              ))}
            </div>
            <div className="test-text">"The prediction accuracy was spot on. I got into NIT Warangal exactly as predicted. The cutoff trend analysis helped me shortlist colleges confidently."</div>
            <div className="test-author">
              <div className="test-av" style={{ background: '#ede9fe', color: '#5b4fcf' }}>RK</div>
              <div><div className="test-name">Rahul Kumar</div><div className="test-meta">NIT Warangal · JEE Main 2024</div></div>
            </div>
          </div>
          <div className="test-card">
            <div className="test-stars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="test-star" style={{ width: '14px', height: '14px', background: '#5b4fcf', borderRadius: '3px' }}></div>
              ))}
            </div>
            <div className="test-text">"AP EAPCET counselling used to confuse me. This platform made it so simple — I could see exactly which branches were open for my rank and category."</div>
            <div className="test-author">
              <div className="test-av" style={{ background: '#dcfce7', color: '#16a34a' }}>PS</div>
              <div><div className="test-name">Priya Sharma</div><div className="test-meta">JNTU Kakinada · AP EAPCET 2024</div></div>
            </div>
          </div>
          <div className="test-card">
            <div className="test-stars">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="test-star" style={{ width: '14px', height: '14px', background: '#5b4fcf', borderRadius: '3px' }}></div>
              ))}
            </div>
            <div className="test-text">"Saved countless hours of manual research. The college comparison feature is brilliant — fees, placements, cutoffs all in one view. Highly recommend!"</div>
            <div className="test-author">
              <div className="test-av" style={{ background: '#e0f2fe', color: '#0284c7' }}>AM</div>
              <div><div className="test-name">Arjun Mehta</div><div className="test-meta">IIT Bombay · JEE Advanced 2024</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="cta-banner-eyebrow">Join 50,000+ students</div>
          <div className="cta-banner-h">Ready to Predict Your Future?</div>
          <div className="cta-banner-sub">Join thousands of students who are making smarter admission decisions every day</div>
          <Link to="/login">
            <button className="cta-banner-btn">
              Get started for free
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="#5b4fcf" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
};

export default Home;