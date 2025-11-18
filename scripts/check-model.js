// scripts/check-model.js
// Run this in prebuild / prestart to block deployments that select "grok".
const envKeys = ['MODEL','OPENAI_MODEL','ANTHROPIC_MODEL','PROVIDER_MODEL'];
function findModel() {
  for (const k of envKeys) {
    const v = process.env[k];
    if (v) return { key: k, value: v };
  }
  return null;
}
const found = findModel();
if (found) {
  const v = String(found.value).toLowerCase();
  if (v.includes('grok')) {
    console.error(`Deployment blocked: environment variable ${found.key} is set to "${found.value}" (contains "grok").`);
    console.error('Remove or change the model env var to an allowed model and try again.');
    process.exit(1);
  }
}
console.log('Model check passed:', found ? `${found.key}=${found.value}` : 'no model env var found');
