import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FaRobot,
  FaMapMarkedAlt,
  FaUniversity,
  FaHandsHelping,
  FaLeaf,
  FaRocket,
  FaPaperPlane,
  FaClipboardList,
  FaLightbulb,
} from 'react-icons/fa';
import './Chatbot.css';

const QUICK_ACTIONS = [
  {
    label: 'Top Priorities',
    icon: FaUniversity,
    buildPrompt: (state) => `What are the top emission-control priorities in ${state}?`,
  },
  {
    label: 'Household Actions',
    icon: FaHandsHelping,
    buildPrompt: (state) => `What can households in ${state} do to reduce emissions?`,
  },
  {
    label: 'Industry Focus',
    icon: FaLeaf,
    buildPrompt: (state) => `What are the main industrial emission reduction actions for ${state}?`,
  },
  {
    label: 'Transport Focus',
    icon: FaRocket,
    buildPrompt: (state) => `How can ${state} reduce transport emissions effectively?`,
  },
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [states, setStates] = useState([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [stateData, setStateData] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatScrollRef = useRef(null);
  const hasAttemptedStateLoadRef = useRef(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchStates = useCallback(async () => {
    hasAttemptedStateLoadRef.current = true;
    setStatesLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chatbot/states/`, {
        timeout: 7000,
      });

      if (response.data.success && response.data.data) {
        setStates(response.data.data);
        setError(null);
      } else {
        setError('No states data received from server');
      }
    } catch (apiError) {
      setError(`Failed to load states: ${apiError.message}`);
    } finally {
      setStatesLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    if (isOpen && states.length === 0 && !statesLoading && !hasAttemptedStateLoadRef.current) {
      fetchStates();
    }
  }, [isOpen, states.length, statesLoading, fetchStates]);

  useEffect(() => {
    if (!chatScrollRef.current) return;
    chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, queryLoading, loading, stateData, selectedState]);

  const handleRetryStates = useCallback(() => {
    hasAttemptedStateLoadRef.current = false;
    fetchStates();
  }, [fetchStates]);

  const handleCloseChatbot = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        handleCloseChatbot();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleCloseChatbot]);

  const handleStateSelect = async (state) => {
    if (!state) return;

    setSelectedState(state);
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/chatbot/state/${encodeURIComponent(state)}`);

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setStateData({
          ...data,
          programs: data.displayPrograms || data.programs || [],
          suggestions: data.displaySuggestions || data.suggestions || [],
          verificationNote: data.verificationNote || 'Using project dataset directly.',
        });
      } else {
        setError('No data available for this state');
      }
    } catch (apiError) {
      setError(`Failed to load state data: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (presetMessage) => {
    const message = (presetMessage || chatInput).trim();
    if (!message) return;

    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setChatInput('');
    setQueryLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chatbot/query`, { message });

      if (!response.data.success || !response.data.data) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'I could not process that. Please try again.' },
        ]);
        return;
      }

      const data = response.data.data;

      if (data.state) {
        setSelectedState(data.state);
      }

      setStateData({
        state: data.state || selectedState,
        programs: data.displayPrograms || data.programs || [],
        suggestions: data.displaySuggestions || data.suggestions || [],
        verificationNote: data.verificationNote || 'Using project dataset directly.',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer || 'Here are some suggestions for emission control.',
        },
      ]);
    } catch (apiError) {
      setError(`Failed to query assistant: ${apiError.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Could not reach assistant. Please retry.',
        },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuery = (action) => {
    if (!selectedState || queryLoading) return;
    setChatInput(action.buildPrompt(selectedState));
  };

  const hasMessages = messages.length > 0 || queryLoading;

  return (
    <>
      <div className="chatbot-layer">
        <button
          type="button"
          className={`chatbot-close-x ${isOpen ? 'open' : ''}`}
          onClick={handleCloseChatbot}
          aria-label="Close carbon reduction assistant"
          title="Close chatbot"
        >
          ×
        </button>

        <button
          type="button"
          className={`chatbot-button ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen((prev) => !prev)}
          title="Carbon Reduction Assistant"
          aria-label={isOpen ? 'Close carbon reduction assistant' : 'Open carbon reduction assistant'}
          aria-expanded={isOpen}
          aria-controls="carbon-assistant-panel"
        >
          <FaRobot aria-hidden="true" />
        </button>

        <div
          id="carbon-assistant-panel"
          className={`chatbot-container ${isOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="Carbon Reduction Assistant"
        >
        <div className="chatbot-header">
          <div>
            <h3>Carbon Assistant</h3>
            <p>We are online</p>
          </div>
        </div>

        <div className="chatbot-body">
          <div className="chat-scroll-area" ref={chatScrollRef}>
            {error && (
              <div className="error-message" role="alert">
                <strong>{error}</strong>
                <button type="button" onClick={handleRetryStates} className="retry-btn">Retry</button>
              </div>
            )}

            <div className="state-selector">
              <label htmlFor="state-select"><FaMapMarkedAlt aria-hidden="true" /> State</label>
              {statesLoading && !error ? (
                <div className="loading-text" aria-live="polite">
                  <span className="spinner">⌛</span> Loading states...
                </div>
              ) : (
                <select
                  id="state-select"
                  value={selectedState}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  disabled={states.length === 0 || statesLoading}
                >
                  <option value="">Choose a state...</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {loading && (
              <div className="loading">
                <span className="spinner">⏳</span> Loading details...
              </div>
            )}

            {stateData && !loading && (
              <div className="state-info">
                <div className="verification-note">{stateData.verificationNote}</div>
                <div className="programs-section">
                  <h4><FaClipboardList aria-hidden="true" /> Current Programs</h4>
                  {stateData.programs && stateData.programs.length > 0 ? (
                    stateData.programs.map((program, index) => (
                      <div key={index} className="program-card">
                        <h5>{program.name}</h5>
                        <p className="org-tag">{program.organization}</p>
                        <p>{program.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No programs available</p>
                  )}
                </div>

                <div className="suggestions-section">
                  <h4><FaLightbulb aria-hidden="true" /> Suggested Actions</h4>
                  {stateData.suggestions && stateData.suggestions.length > 0 ? (
                    <ul>
                      {stateData.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-data">No suggestions available</p>
                  )}
                </div>
              </div>
            )}

            {hasMessages && (
              <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat conversation">
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.role}`} tabIndex={0}>
                    {msg.text}
                  </div>
                ))}
                {queryLoading && (
                  <div className="chat-message assistant" aria-live="assertive">
                    Thinking...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="chat-composer">
            {selectedState && (
              <div className="quick-options" aria-label="Pre-made options for selected state">
                <div className="preset-query-list" role="list">
                  {QUICK_ACTIONS.map((action, idx) => (
                    // Icon + compact label gives visual grouping without adding extra text blocks.
                    <button
                      key={idx}
                      type="button"
                      className="preset-query-btn"
                      onClick={() => handleQuickQuery(action)}
                      disabled={queryLoading}
                      aria-label={`${action.label} for ${selectedState}`}
                    >
                      <action.icon aria-hidden="true" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="chat-input-row">
              <label htmlFor="chat-input" className="sr-only">Ask about emission control schemes and ideas</label>
              <input
                id="chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <button type="button" onClick={() => handleSend()} disabled={queryLoading || !chatInput.trim()}>
                <FaPaperPlane aria-hidden="true" />
                Send
              </button>
            </div>
          </div>

        </div>
      </div>
      </div>
    </>
  );
};

export default Chatbot;
