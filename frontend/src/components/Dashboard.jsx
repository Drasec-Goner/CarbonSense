import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load Tableau JavaScript API
    const script = document.createElement('script');
    script.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    script.async = true;
    script.onload = () => setIsLoading(false);
    document.body.appendChild(script);

    const fallback = setTimeout(() => setIsLoading(false), 2200);

    return () => {
      clearTimeout(fallback);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Carbon Emissions Dashboard</h1>
      <div className="tableau-container">
        {isLoading && (
          <div className="section-loader" role="status" aria-live="polite">
            <div className="loader-dot" />
            <span>Loading interactive dashboard...</span>
          </div>
        )}
        <div
          className="tableauPlaceholder"
          id="viz1699264689524"
          style={{ position: 'relative' }}
        >
          <noscript>
            <a
              href="https://public.tableau.com/views/CarbonSenseIndia_Dashboard/Overview?:showVizHome=no"
              target="_blank"
              rel="noreferrer"
              aria-label="Open the CarbonSense Tableau dashboard in a new tab"
            >
              <img
                alt="Overview"
                src="https://public.tableau.com/static/images/Ca/CarbonSenseIndia_Dashboard/Overview/1_rss.png"
                style={{ border: 'none' }}
              />
            </a>
          </noscript>
          <object className="tableauViz" style={{ display: 'none' }}>
            <param name="host_url" value="https%3A%2F%2Fpublic.tableau.com%2F" />
            <param name="embed_code_version" value="3" />
            <param name="site_root" value="" />
            <param name="name" value="CarbonSenseIndia_Dashboard/Overview" />
            <param name="tabs" value="no" />
            <param name="toolbar" value="yes" />
            <param name="static_image" value="https://public.tableau.com/static/images/Ca/CarbonSenseIndia_Dashboard/Overview/1.png" />
            <param name="animate_transition" value="yes" />
            <param name="display_static_image" value="yes" />
            <param name="display_spinner" value="yes" />
            <param name="display_overlay" value="yes" />
            <param name="display_count" value="yes" />
            <param name="language" value="en-US" />
            <param name="filter" value="publish=yes" />
          </object>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
