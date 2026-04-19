const express = require('express');
const router = express.Router();
const StateProgram = require('../models/StateProgram');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

const DEFAULT_GHG_IDEAS = [
  'Shift to efficient appliances and LED lighting in homes and offices',
  'Use public transport, EVs, cycling, and shared mobility to cut transport emissions',
  'Scale rooftop solar and community solar programs',
  'Improve waste segregation, composting, and methane capture from landfills',
  'Promote climate-smart agriculture and efficient irrigation',
  'Expand urban tree cover and restore degraded ecosystems',
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findMentionedState = (message, states) => {
  const lowerMessage = message.toLowerCase();
  return states.find((state) => lowerMessage.includes(state.toLowerCase())) || null;
};

const isProjectRelevantQuestion = (message) => {
  const text = message.toLowerCase();

  return /\b(climate|emission|emissions|ghg|greenhouse|carbon|pollution|air quality|smog|energy|renewable|solar|waste|transport|vehicle|industry|industrial|factory|agriculture|farm|crop|stubble|residue|household|home|scheme|program|policy|initiative|reduce|control|combat|mitigate|clean|priority|priorities)\b/i.test(
    text
  );
};

const detectIntent = (message) => {
  const text = message.toLowerCase();

  if (!isProjectRelevantQuestion(text)) {
    return 'unsupported';
  }

  if (/(household|home|homes|residential|domestic|kitchen|appliance|appliances|lighting)/i.test(text)) {
    return 'households';
  }

  if (/(transport|traffic|vehicle|vehicles|commute|mobility|road)/i.test(text)) {
    return 'transport';
  }

  if (/(industrial|industry|industries|factory|factories|manufacturing|plant)/i.test(text)) {
    return 'industry';
  }

  if (/(agriculture|farm|farming|crop|crops|stubble|residue|biomass)/i.test(text)) {
    return 'agriculture';
  }

  if (/(priority|priorities|top priority|top priorities|main priority|main priorities|key priority|key priorities)/i.test(text)) {
    return 'priorities';
  }

  if (/(scheme|program|policy|initiative|yojana|subsidy|government|ngo)/i.test(text)) {
    return 'schemes';
  }

  if (/(suggest|idea|what can|how to|control|reduce|emission|ghg|greenhouse)/i.test(text)) {
    return 'ideas';
  }

  return 'overview';
};

const formatProgramLines = (programs = []) =>
  programs.slice(0, 6).map((program) => `- ${program.name} (${program.organization}): ${program.description}`);

const formatSuggestionLines = (suggestions = []) =>
  suggestions.slice(0, 6).map((idea) => `- ${idea}`);

const FALLBACK_IDEAS = {
  households: [
    'Shift to efficient appliances and LED lighting in homes and offices',
    'Improve waste segregation, composting, and methane capture from landfills',
    'Scale rooftop solar and community solar programs',
  ],
  transport: [
    'Use public transport, EVs, cycling, and shared mobility to cut transport emissions',
    'Improve traffic flow and reduce congestion during peak hours',
    'Expand charging infrastructure and clean fleet transition support',
  ],
  industry: [
    'Upgrade industrial energy efficiency and heat management',
    'Electrify suitable industrial processes and use cleaner fuels',
    'Improve waste recovery and emissions monitoring across plants',
  ],
  agriculture: [
    'Promote crop residue management technologies',
    'Develop biomass energy from agricultural waste',
    'Implement sustainable farming practices',
  ],
  priorities: [
    'Promote crop residue management technologies',
    'Scale cleaner energy and efficiency programs in homes and industry',
    'Improve waste segregation, composting, and methane capture from landfills',
    'Expand public transport and low-emission mobility options',
  ],
  ideas: DEFAULT_GHG_IDEAS.slice(0, 4),
};

const getIntentTitle = (intent) => {
  switch (intent) {
    case 'households':
      return 'Household actions';
    case 'transport':
      return 'Transport actions';
    case 'industry':
      return 'Industrial actions';
    case 'agriculture':
      return 'Agricultural actions';
    case 'priorities':
      return 'Top priorities';
    case 'schemes':
      return 'Programs';
    default:
      return 'Ideas';
  }
};

const pickRelevantIdeas = (intent, suggestions = []) => {
  const lowerSuggestions = suggestions.map((idea) => String(idea).toLowerCase());

  const selectedIdeas = [];
  const addIdeaByKeyword = (keywordPattern) => {
    suggestions.forEach((idea, index) => {
      if (keywordPattern.test(lowerSuggestions[index]) && !selectedIdeas.includes(idea)) {
        selectedIdeas.push(idea);
      }
    });
  };

  switch (intent) {
    case 'households':
      addIdeaByKeyword(/home|house|residential|lighting|appliance|energy|waste|solar/);
      break;
    case 'transport':
      addIdeaByKeyword(/transport|vehicle|mobility|public transport|ev|electric/);
      break;
    case 'industry':
      addIdeaByKeyword(/industry|industrial|factory|efficiency|energy|waste/);
      break;
    case 'agriculture':
      addIdeaByKeyword(/agri|farm|crop|stubble|residue|biomass|irrigation/);
      break;
    default:
      break;
  }

  return selectedIdeas.length ? selectedIdeas : FALLBACK_IDEAS[intent] || suggestions.slice(0, 3);
};

const buildAnswer = ({ intent, message, stateName, programs, suggestions, ngos }) => {
  const text = message.toLowerCase();
  const asksGovernment = /government|govt|policy|scheme|program|initiative/i.test(text);
  const asksNgo = /ngo|non.?government/i.test(text);

  if (intent === 'households') {
    const householdIdeas = FALLBACK_IDEAS.households;

    return [
      `Household actions for ${stateName}:`,
      ...formatSuggestionLines(householdIdeas),
    ].join('\n');
  }

  if (intent === 'transport') {
    const transportIdeas = FALLBACK_IDEAS.transport;

    return [
      `Transport actions for ${stateName}:`,
      ...formatSuggestionLines(transportIdeas),
    ].join('\n');
  }

  if (intent === 'industry') {
    const industrialPrograms = programs.filter((program) => {
      const org = String(program.organization || '').toLowerCase();
      const name = String(program.name || '').toLowerCase();
      const description = String(program.description || '').toLowerCase();
      return /(industry|industrial|factory|manufacturing|energy|efficiency|waste)/.test(`${org} ${name} ${description}`);
    });

    const industrialIdeas = FALLBACK_IDEAS.industry;

    if (industrialPrograms.length) {
      return [`Industrial actions for ${stateName}:`, ...formatProgramLines(industrialPrograms)].join('\n');
    }

    return [
      `Industrial actions for ${stateName}:`,
      ...formatSuggestionLines(industrialIdeas),
    ].join('\n');
  }

  if (intent === 'agriculture') {
    const agriIdeas = FALLBACK_IDEAS.agriculture;

    return [
      `Agricultural actions for ${stateName}:`,
      ...formatSuggestionLines(agriIdeas),
    ].join('\n');
  }

  if (intent === 'priorities') {
    const priorityIdeas = FALLBACK_IDEAS.priorities;
    const priorityPrograms = programs.slice(0, 3);

    return [
      `Top priorities for ${stateName}:`,
      ...formatSuggestionLines(priorityIdeas),
      ...(priorityPrograms.length ? ['Programs to review:', ...formatProgramLines(priorityPrograms)] : []),
    ].join('\n');
  }

  if (intent === 'schemes') {
    const scopedPrograms = programs.filter((program) => {
      const org = String(program.organization || '').toLowerCase();
      if (asksNgo && !asksGovernment) return /ngo|non.?government/.test(org);
      if (asksGovernment && !asksNgo) return !/ngo|non.?government/.test(org);
      return true;
    });

    if (!scopedPrograms.length) {
      if (asksNgo) {
        return `No NGO-specific schemes found in project data for ${stateName}.`;
      }
      return `No matching schemes found in project data for ${stateName}.`;
    }

    return [`Programs for ${stateName}:`, ...formatProgramLines(scopedPrograms)].join('\n');
  }

  if (intent === 'ideas') {
    const ideasForQuestion = FALLBACK_IDEAS.ideas;

    return [`${getIntentTitle(intent)} for ${stateName}:`, ...formatSuggestionLines(ideasForQuestion)].join('\n');
  }

  if (intent === 'unsupported') {
    return `I can only answer questions about state-level emission control, climate actions, schemes, transport, industry, agriculture, or household emissions. Please ask a Punjab or other Indian state climate question.`;
  }

  const overviewLines = [
    `${stateName}: ${programs.length} program(s), ${suggestions.length} suggested action(s).`,
  ];

  if (ngos.length) {
    overviewLines.push(`NGO-linked programs: ${ngos.map((x) => x.name).join(', ')}`);
  }

  return overviewLines.join('\n');
};

const parseJsonObject = (rawText) => {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch (error) {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (secondError) {
      return null;
    }
  }
};

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const mergePrograms = (projectPrograms = [], aiPrograms = []) => {
  const byKey = new Map();

  projectPrograms.forEach((program) => {
    const key = `${normalizeKey(program.name)}|${normalizeKey(program.organization)}`;
    byKey.set(key, program);
  });

  aiPrograms.forEach((program) => {
    const key = `${normalizeKey(program.name)}|${normalizeKey(program.organization)}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, program);
      return;
    }

    // Keep the richer description while preserving stable name/organization.
    const existingDesc = String(existing.description || '');
    const aiDesc = String(program.description || '');

    if (aiDesc.length > existingDesc.length) {
      byKey.set(key, {
        ...existing,
        description: aiDesc,
      });
    }
  });

  return Array.from(byKey.values());
};

const mergeSuggestions = (projectSuggestions = [], aiSuggestions = []) => {
  const byKey = new Map();

  projectSuggestions.forEach((idea) => {
    byKey.set(normalizeKey(idea), idea);
  });

  aiSuggestions.forEach((idea) => {
    const key = normalizeKey(idea);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, idea);
      return;
    }

    if (String(idea).length > String(existing).length) {
      byKey.set(key, idea);
    }
  });

  return Array.from(byKey.values());
};

const getGeminiVerifiedStateView = async ({ stateData }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || typeof fetch !== 'function') {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const prompt = [
    'You are validating state climate data against project-provided records.',
    'Return strict JSON only.',
    'Do NOT add facts not present in input.',
    'You may improve wording clarity while preserving meaning.',
    'JSON shape:',
    '{"verifiedPrograms":[{"name":"","organization":"","description":""}],"verifiedSuggestions":[""],"verificationNote":""}',
    `State: ${stateData.state}`,
    `Programs input JSON: ${JSON.stringify(stateData.programs || [])}`,
    `Suggestions input JSON: ${JSON.stringify(stateData.suggestions || [])}`,
  ].join('\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 600,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  const parsed = parseJsonObject(text);

  if (!parsed) {
    return null;
  }

  const verifiedPrograms = Array.isArray(parsed.verifiedPrograms)
    ? parsed.verifiedPrograms.filter(
        (p) => p && typeof p.name === 'string' && typeof p.organization === 'string' && typeof p.description === 'string'
      )
    : [];

  const verifiedSuggestions = Array.isArray(parsed.verifiedSuggestions)
    ? parsed.verifiedSuggestions.filter((s) => typeof s === 'string')
    : [];

  return {
    verifiedPrograms,
    verifiedSuggestions,
    verificationNote: typeof parsed.verificationNote === 'string' ? parsed.verificationNote : 'AI verified from project data.',
  };
};

const getGeminiAnswer = async ({ message, stateData, intent, ideas, ngoSchemes }) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || typeof fetch !== 'function') {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const prompt = [
    'You are a climate assistant focused on India state-level emission control.',
    'Answer in plain factual points only.',
    'No intro text, no filler, no conclusion.',
    'Use numbered list format.',
    'If data is missing, clearly say so and provide general GHG reduction ideas.',
    `Intent: ${intent}`,
    `User message: ${message}`,
    `State: ${stateData.state}`,
    `State programs summary: ${(stateData.programs || []).map((program) => `${program.name} | ${program.organization} | ${program.description}`).join(' || ')}`,
    `State suggestions summary: ${(stateData.suggestions || []).join(' || ')}`,
    `Programs JSON: ${JSON.stringify(stateData.programs || [])}`,
    `Suggestions JSON: ${JSON.stringify(stateData.suggestions || [])}`,
    `NGO schemes JSON: ${JSON.stringify(ngoSchemes || [])}`,
    `General GHG ideas JSON: ${JSON.stringify(ideas)}`,
  ].join('\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 450,
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || null;
};

// Get programs and suggestions for a specific state
router.get('/state/:stateName', async (req, res) => {
  try {
    const stateName = decodeURIComponent(req.params.stateName).trim();
    const stateData = await StateProgram.findOne({
      state: { $regex: new RegExp(`^${escapeRegex(stateName)}$`, 'i') },
    });

    if (!stateData) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
      });
    }

    const verifiedState = await getGeminiVerifiedStateView({ stateData });
    const displayPrograms = mergePrograms(stateData.programs || [], verifiedState?.verifiedPrograms || []);
    const displaySuggestions = mergeSuggestions(stateData.suggestions || [], verifiedState?.verifiedSuggestions || []);

    res.json({
      success: true,
      data: {
        ...stateData.toObject(),
        displayPrograms,
        displaySuggestions,
        verificationSource: verifiedState ? 'ai-plus-project-data' : 'project-data',
        verificationNote: verifiedState
          ? (verifiedState?.verificationNote || 'Merged AI-verified and project data.')
          : 'Using project dataset directly.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get all available states
router.get('/states', async (req, res) => {
  try {
    const states = await StateProgram.find({}, 'state').sort({ state: 1 });
    const stateNames = states.map((s) => s.state);

    res.json({
      success: true,
      data: stateNames,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Conversational query endpoint
router.post('/query', async (req, res) => {
  try {
    const message = (req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    if (!isProjectRelevantQuestion(message)) {
      return res.json({
        success: true,
        data: {
          intent: 'unsupported',
          answer:
            'I can only answer questions about state-level emissions, climate actions, transport, industry, agriculture, household emissions, or related schemes for this project.',
          ideas: DEFAULT_GHG_IDEAS,
        },
      });
    }

    const states = await StateProgram.find({}, 'state').sort({ state: 1 });
    const stateNames = states.map((s) => s.state);
    const detectedState = findMentionedState(message, stateNames);

    if (!detectedState) {
      return res.json({
        success: true,
        data: {
          intent: 'clarify_state',
          answer:
            'Please mention an Indian state (for example: Maharashtra, Delhi, Gujarat) so I can suggest emission-control schemes and GHG reduction ideas specific to that state.',
          availableStates: stateNames,
          ideas: DEFAULT_GHG_IDEAS,
        },
      });
    }

    const stateData = await StateProgram.findOne({ state: detectedState });

    if (!stateData) {
      return res.status(404).json({
        success: false,
        message: 'State not found',
      });
    }

    const intent = detectIntent(message);
    const ngos = (stateData.programs || []).filter((program) =>
      /ngo|non.?government/i.test(program.organization)
    );

    const verifiedState = await getGeminiVerifiedStateView({ stateData });
    const displayPrograms = mergePrograms(stateData.programs || [], verifiedState?.verifiedPrograms || []);
    const displaySuggestions = mergeSuggestions(stateData.suggestions || [], verifiedState?.verifiedSuggestions || []);

    if (intent === 'unsupported') {
      return res.json({
        success: true,
        data: {
          state: stateData.state,
          intent,
          answer:
            'I can only answer state climate and emission questions for this project. Please ask about Punjab or another Indian state, and mention emissions, transport, industry, agriculture, household actions, or schemes.',
          aiEnabled: Boolean(process.env.GEMINI_API_KEY),
          aiProvider: 'rule-based',
          programs: stateData.programs || [],
          suggestions: stateData.suggestions || [],
          displayPrograms,
          displaySuggestions,
          verificationSource: verifiedState ? 'ai-plus-project-data' : 'project-data',
          verificationNote: verifiedState
            ? (verifiedState?.verificationNote || 'Merged AI-verified and project data.')
            : 'Using project dataset directly.',
          ngoSchemes: ngos,
          ideas: DEFAULT_GHG_IDEAS,
        },
      });
    }
    const defaultAnswer = buildAnswer({
      intent,
      message,
      stateName: stateData.state,
      programs: displayPrograms,
      suggestions: displaySuggestions,
      ngos,
    });
    const geminiAnswer = await getGeminiAnswer({
      message,
      stateData,
      intent,
      ideas: DEFAULT_GHG_IDEAS,
      ngoSchemes: ngos,
    });

    return res.json({
      success: true,
      data: {
        state: stateData.state,
        intent,
        answer: geminiAnswer || defaultAnswer,
        aiEnabled: Boolean(process.env.GEMINI_API_KEY),
        aiProvider: geminiAnswer ? 'gemini' : 'rule-based',
        programs: stateData.programs || [],
        suggestions: stateData.suggestions || [],
        displayPrograms,
        displaySuggestions,
        verificationSource: verifiedState ? 'ai-plus-project-data' : 'project-data',
        verificationNote: verifiedState
          ? (verifiedState?.verificationNote || 'Merged AI-verified and project data.')
          : 'Using project dataset directly.',
        ngoSchemes: ngos,
        ideas: DEFAULT_GHG_IDEAS,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

module.exports = router;
