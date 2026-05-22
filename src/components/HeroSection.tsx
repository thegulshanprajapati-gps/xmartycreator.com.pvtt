import React from 'react';
import './HeroSection.css';

const HeroSection: React.FC = () => {
  return (
    <>
      <section className="hero-section" id="hero">
        <div className="hero-content">
          <div className="hero-badge">Next Generation Learning</div>
          
          <h1 className="hero-title">
            Master the Future <br /> of Technology.
          </h1>
          
          <p className="hero-description">
            Elite-level education for the digital frontier. One lesson at a time, focused and distraction-free.
          </p>
          
          <div className="hero-cta-wrapper">
            <button className="btn-primary">Join the Revolution</button>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div className="dot-group">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
              <div className="skeleton-line short" style={{ margin: 0 }}></div>
            </div>
            
            <div className="card-content">
              <div className="main-skeleton" style={{ gap: '1rem' }}>
                <div className="live-class-card">
                  <div className="live-badge">
                    <div className="live-dot"></div>
                    NEXT LIVE CLASS
                  </div>
                  <h3 className="live-title">Aptitude Sprint Mastery</h3>
                  <p className="live-meta">Today | 08:00 PM</p>
                </div>

                <div className="metrics-row">
                  <div className="metric-item">
                    <span className="metric-label">Course Progress</span>
                    <div className="metric-bar-bg">
                      <div className="metric-bar-fill" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Success Rate</span>
                    <span className="metric-value">98.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="hero-section" id="feature" style={{ backgroundColor: '#050505' }}>
        <div className="hero-content">
          <h2 className="hero-title" style={{ fontSize: '3rem' }}>Stay Focused.</h2>
          <p className="hero-description">The simplest UI is the most powerful tool for deep work.</p>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
