import React from 'react';
import {
  FaBolt,
  FaBus,
  FaIndustry,
  FaLeaf,
  FaMapMarkedAlt,
  FaRegLightbulb,
  FaDownload,
  FaCheckCircle,
} from 'react-icons/fa';
import './ResearchPaper.css';

const emissionMix = [
  { sector: 'Power & Energy', share: 38, icon: FaBolt, detail: 'Coal-heavy electricity generation remains the largest source.' },
  { sector: 'Transport', share: 24, icon: FaBus, detail: 'Freight movement and urban vehicle growth drive fuel demand.' },
  { sector: 'Industry', share: 21, icon: FaIndustry, detail: 'Steel, cement, and process heat intensify emissions intensity.' },
  { sector: 'Agriculture & Land', share: 17, icon: FaLeaf, detail: 'Methane and land-use patterns shape regional climate pressure.' },
];

const stateRiskBands = [
  { band: 'High Emission + High Vulnerability', states: 'Maharashtra, Gujarat, Tamil Nadu, Uttar Pradesh', color: 'high' },
  { band: 'Medium Emission + Rising Climate Stress', states: 'Karnataka, Rajasthan, Andhra Pradesh, Haryana', color: 'medium' },
  { band: 'Low Emission + Fragile Ecosystems', states: 'North-East states, Himalayan belt, island territories', color: 'low' },
];

const roadmap = [
  {
    phase: '2026-2030',
    title: 'Stabilize Growth in Emissions',
    points: [
      'Scale renewable procurement and storage in high-load states',
      'Shift freight corridors to rail and multimodal logistics',
      'Expand clean cooking and urban EV ecosystem',
    ],
  },
  {
    phase: '2030-2040',
    title: 'Deep Sector Decarbonization',
    points: [
      'Industrial heat electrification and green hydrogen pilots',
      'Grid flexibility with advanced demand response',
      'State-level carbon budgeting with annual disclosure',
    ],
  },
  {
    phase: '2040-2070',
    title: 'Net-Zero Pathway Consolidation',
    points: [
      'Hard-to-abate sector transition financing',
      'Large-scale ecosystem restoration and carbon sinks',
      'Adaptive resilience planning for climate extremes',
    ],
  },
];

const ResearchPaper = () => {
  return (
    <div className="research-container">
      <header className="research-hero">
        <h1>Studies & Climate Intelligence</h1>
        <p>
          A structured evidence brief on India’s emissions profile, regional vulnerability, and practical transition pathway.
          This page is designed as a study dashboard so students, policy learners, and citizens can understand both what is
          happening and what must happen next.
        </p>
      </header>

      <section className="research-surface">
        <div className="surface-grid">
          <article className="surface-card intro-card">
            <h2>What This Study Explains</h2>
            <p>
              CarbonSense combines multi-year emissions trends, sector-level activity, and state-wise risk signals to build
              an interpretable climate narrative for India. Instead of just showing charts, it links patterns to action.
            </p>
            <ul>
              <li><FaCheckCircle /> Where emissions are concentrated</li>
              <li><FaCheckCircle /> Which regions carry highest climate pressure</li>
              <li><FaCheckCircle /> Which policy levers can reduce emissions faster</li>
            </ul>
          </article>

          <article className="surface-card mini-kpi-card">
            <h3>Core Insights</h3>
            <div className="mini-kpis">
              <div>
                <strong>Top Contributors</strong>
                <span>Energy + Transport + Industry</span>
              </div>
              <div>
                <strong>Risk Concentration</strong>
                <span>Western coast, industrial belts, urban corridors</span>
              </div>
              <div>
                <strong>Policy Priority</strong>
                <span>State-specific action over one-size-fits-all targets</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="research-section">
        <h2><FaRegLightbulb /> Emission Mix Infographic</h2>
        <div className="mix-grid">
          {emissionMix.map((item) => {
            const Icon = item.icon;
            return (
              <article className="mix-card" key={item.sector}>
                <div className="mix-head">
                  <Icon />
                  <h3>{item.sector}</h3>
                </div>
                <div className="mix-bar-wrap" aria-label={`${item.sector} share ${item.share} percent`}>
                  <div className="mix-bar" style={{ width: `${item.share}%` }} />
                </div>
                <p className="mix-share">{item.share}% share</p>
                <p>{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="research-section">
        <h2><FaMapMarkedAlt /> Regional Vulnerability Bands</h2>
        <div className="risk-grid">
          {stateRiskBands.map((band) => (
            <article className={`risk-card ${band.color}`} key={band.band}>
              <h3>{band.band}</h3>
              <p>{band.states}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="research-section">
        <h2>Decarbonization Roadmap</h2>
        <div className="roadmap-grid">
          {roadmap.map((step) => (
            <article className="roadmap-card" key={step.phase}>
              <span className="phase-pill">{step.phase}</span>
              <h3>{step.title}</h3>
              <ul>
                {step.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="research-section final-cta">
        <h2>Full Research Report</h2>
        <p>
          Download the full report for references, assumptions, data methodology, and detailed policy recommendations.
        </p>
        <a href="/research/complete-research-paper.pdf" download className="download-btn">
          <FaDownload /> Download Full Paper (PDF)
        </a>
      </section>
    </div>
  );
};

export default ResearchPaper;
