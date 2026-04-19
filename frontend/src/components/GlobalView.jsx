import React, { useState, useEffect, useMemo, useRef } from 'react';
import Globe from 'react-globe.gl';
import './GlobalView.css';

const REGION_VIEWS = {
  global: { lat: 20, lng: 10, altitude: 2.2 },
  arctic: { lat: 73, lng: -25, altitude: 1.55 },
  antarctic: { lat: -75, lng: 15, altitude: 1.55 },
  tropics: { lat: 3, lng: 40, altitude: 1.7 },
};

const OBSERVATION_POINTS = [
  { name: 'Reykjavik', lat: 64.1, lng: -21.9 },
  { name: 'Delhi', lat: 28.61, lng: 77.21 },
  { name: 'Sao Paulo', lat: -23.55, lng: -46.63 },
  { name: 'Cape Town', lat: -33.92, lng: 18.42 },
  { name: 'Tokyo', lat: 35.67, lng: 139.65 },
  { name: 'Sydney', lat: -33.86, lng: 151.2 },
];

const DATA_FLOWS = [
  { startLat: -33.86, startLng: 151.2, endLat: -75, endLng: 0, severity: 'high' },
  { startLat: 28.61, startLng: 77.21, endLat: 73, endLng: -25, severity: 'moderate' },
  { startLat: 35.67, startLng: 139.65, endLat: 64.1, endLng: -21.9, severity: 'moderate' },
  { startLat: -23.55, startLng: -46.63, endLat: -33.92, endLng: 18.42, severity: 'low' },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getColorForOzoneLevel = (level) => {
  if (level < 220) return '#e63946';
  if (level < 260) return '#f4a261';
  if (level < 300) return '#f1fa8c';
  return '#66ff88';
};

const getFlowColor = (severity) => {
  if (severity === 'high') return ['rgba(230,57,70,0.85)', 'rgba(230,57,70,0.2)'];
  if (severity === 'moderate') return ['rgba(244,162,97,0.8)', 'rgba(244,162,97,0.2)'];
  return ['rgba(102,255,136,0.8)', 'rgba(102,255,136,0.2)'];
};

const getOzoneLevel = (lat, lng) => {
  const latPenalty = Math.abs(lat) * 0.78;
  const planetaryWave = 20 * Math.sin(((lng + lat) * Math.PI) / 90);
  const regionalOscillation = 14 * Math.cos((lng * Math.PI) / 60);
  const seasonalShift = 8 * Math.sin(((lat + 20) * Math.PI) / 70);
  const polarDip = Math.abs(lat) > 55 ? (Math.abs(lat) - 55) * 1.85 : 0;
  const level = 305 - latPenalty + planetaryWave + regionalOscillation + seasonalShift - polarDip;
  return clamp(level, 185, 360);
};

const GlobalView = () => {
  const [countries, setCountries] = useState({ features: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState('global');
  const [viewport, setViewport] = useState({
    width: Math.min(window.innerWidth * 0.92, 1220),
    height: window.innerWidth < 700 ? 380 : window.innerWidth < 1024 ? 500 : 620,
  });

  const globeEl = useRef();

  const ozoneData = useMemo(() => {
    const data = [];

    for (let lat = -84; lat <= 84; lat += 8) {
      for (let lng = -180; lng <= 180; lng += 8) {
        const level = getOzoneLevel(lat, lng);

        data.push({
          lat,
          lng,
          level,
          color: getColorForOzoneLevel(level),
          radius: level < 220 ? 0.48 : level < 260 ? 0.38 : 0.3,
          altitude: level < 220 ? 0.026 : 0.017,
        });
      }
    }

    return data;
  }, []);

  const hotspotRings = useMemo(
    () => ozoneData.filter((point) => point.level < 230).filter((_, idx) => idx % 4 === 0),
    [ozoneData]
  );

  const observationLabels = useMemo(
    () =>
      OBSERVATION_POINTS.map((point) => {
        const level = Math.round(getOzoneLevel(point.lat, point.lng));
        return {
          ...point,
          level,
          label: `${point.name}  ${level} DU`,
          color: getColorForOzoneLevel(level),
        };
      }),
    []
  );

  const ozoneStats = useMemo(() => {
    const total = ozoneData.reduce((sum, item) => sum + item.level, 0);
    const average = Math.round(total / ozoneData.length);
    const min = Math.round(Math.min(...ozoneData.map((item) => item.level)));
    const max = Math.round(Math.max(...ozoneData.map((item) => item.level)));
    const criticalZones = ozoneData.filter((item) => item.level < 220).length;

    return { average, min, max, criticalZones };
  }, [ozoneData]);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const res = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
        const geo = await res.json();
        setCountries(geo);
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setTimeout(() => setIsLoading(false), 700);
      }
    };

    const onResize = () => {
      setViewport({
        width: Math.min(window.innerWidth * 0.92, 1220),
        height: window.innerWidth < 700 ? 380 : window.innerWidth < 1024 ? 500 : 620,
      });
    };

    loadGeoData();
    window.addEventListener('resize', onResize);

    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!globeEl.current) {
      return;
    }

    globeEl.current.pointOfView(REGION_VIEWS[activeRegion], 1200);
  }, [activeRegion]);

  return (
    <div className="global-view-container">
      <div className="global-hero">
        <h1 className="global-title">Global Ozone Intelligence Hub</h1>
        <p className="global-subtitle">
          Near real-time infographic view of ozone health, pressure hotspots, and atmospheric flow corridors.
        </p>
      </div>

      <div className="global-metrics" aria-label="Global ozone highlights">
        <article className="metric-card">
          <h3>Global Average</h3>
          <strong>{ozoneStats.average} DU</strong>
        </article>
        <article className="metric-card">
          <h3>Range</h3>
          <strong>
            {ozoneStats.min} - {ozoneStats.max} DU
          </strong>
        </article>
        <article className="metric-card warning">
          <h3>Critical Cells</h3>
          <strong>{ozoneStats.criticalZones}</strong>
        </article>
      </div>

      <div className="globe-info">
        <div className="legend">
          <h3>Ozone Levels (Dobson Units)</h3>
          <div className="legend-grid">
            <div className="legend-item">
              <span className="color-box" style={{ background: '#66ff88' }} />
              <span>Good (&gt;300)</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#f1fa8c' }} />
              <span>Moderate (260-300)</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#f4a261' }} />
              <span>Low (220-260)</span>
            </div>
            <div className="legend-item">
              <span className="color-box" style={{ background: '#e63946' }} />
              <span>Critical (&lt;220)</span>
            </div>
          </div>
        </div>

        <div className="region-controls" role="tablist" aria-label="Focus globe by region">
          <button
            type="button"
            className={activeRegion === 'global' ? 'active' : ''}
            onClick={() => setActiveRegion('global')}
          >
            Global
          </button>
          <button
            type="button"
            className={activeRegion === 'arctic' ? 'active' : ''}
            onClick={() => setActiveRegion('arctic')}
          >
            Arctic
          </button>
          <button
            type="button"
            className={activeRegion === 'antarctic' ? 'active' : ''}
            onClick={() => setActiveRegion('antarctic')}
          >
            Antarctic
          </button>
          <button
            type="button"
            className={activeRegion === 'tropics' ? 'active' : ''}
            onClick={() => setActiveRegion('tropics')}
          >
            Tropics
          </button>
        </div>
      </div>

      <div className="globe-wrapper">
        {isLoading && (
          <div className="section-loader" role="status" aria-live="polite">
            <div className="loader-dot" />
            <span>Loading globe layers...</span>
          </div>
        )}

        <Globe
          ref={globeEl}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeReady={() => {
            const controls = globeEl.current.controls();
            controls.enableZoom = true;
            controls.enablePan = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.minDistance = 180;
            controls.maxDistance = 520;

            globeEl.current.pointOfView(REGION_VIEWS.global, 0);
          }}
          width={viewport.width}
          height={viewport.height}
          polygonsData={countries.features}
          polygonCapColor={() => 'rgba(175, 198, 224, 0.18)'}
          polygonSideColor={() => 'rgba(104, 132, 160, 0.08)'}
          polygonStrokeColor={() => 'rgba(223, 245, 255, 0.18)'}
          pointsData={ozoneData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude="altitude"
          pointRadius="radius"
          ringsData={hotspotRings}
          ringLat="lat"
          ringLng="lng"
          ringColor={() => (t) => `rgba(230,57,70,${1 - t})`}
          ringMaxRadius={2.3}
          ringPropagationSpeed={0.8}
          ringRepeatPeriod={1400}
          labelsData={observationLabels}
          labelLat="lat"
          labelLng="lng"
          labelText="label"
          labelColor={() => '#d9f5ff'}
          labelSize={() => 0.85}
          labelDotRadius={() => 0.22}
          labelResolution={2}
          arcsData={DATA_FLOWS}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d) => getFlowColor(d.severity)}
          arcDashLength={0.35}
          arcDashGap={0.35}
          arcDashAnimateTime={1800}
          arcStroke={0.65}
          atmosphereColor="#6cd4ff"
          atmosphereAltitude={0.18}
        />
      </div>
    </div>
  );
};

export default GlobalView;
