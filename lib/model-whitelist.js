// lib/model-whitelist.js
// Central model validation/whitelist. Import this where you construct API calls to your model provider.

const ALLOWED_MODELS = [
  // add the models you allow in production here
  'gpt-4o',
  'gpt-4',
  'gpt-3.5-turbo'
];

function normalize(name) {
  return name ? String(name).trim() : '';
}

function validateModel(name) {
  const n = normalize(name).toLowerCase();
  if (!n) {
    throw new Error('No model specified. Set MODEL or OPENAI_MODEL to an allowed model.');
  }
  if (n.includes('grok')) {
    throw new Error('Model "grok" is disallowed by policy.');
  }
  // exact-match against allowed list (case-insensitive)
  const allowedLower = ALLOWED_MODELS.map(m => m.toLowerCase());
  if (!allowedLower.includes(n)) {
    throw new Error(`Model "${name}" is not in the allowed list. Allowed: ${ALLOWED_MODELS.join(', ')}`);
  }
  return name;
}

function getModelFromEnv() {
  return process.env.MODEL || process.env.OPENAI_MODEL || process.env.ANTHROPIC_MODEL || '';
}

module.exports = {
  ALLOWED_MODELS,
  validateModel,
  getModelFromEnv
};
