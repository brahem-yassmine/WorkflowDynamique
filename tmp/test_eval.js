const vm = require('vm');

function evaluateCondition(condition, variables) {
  if (!condition || condition.trim() === '') return true;

  try {
    const context = variables instanceof Map ? Object.fromEntries(variables) : (variables || {});
    const script = new vm.Script(`(${condition})`);
    const result = script.runInNewContext(context);
    return !!result;
  } catch (error) {
    console.error('❌ [LogicEval] Error evaluating condition:', condition, error.message);
    return false;
  }
}

// Test cases
const tests = [
  { cond: "amount > 5000", vars: { amount: 6000 }, expected: true },
  { cond: "amount > 5000", vars: { amount: 4000 }, expected: false },
  { cond: "status == 'urgent'", vars: { status: 'urgent' }, expected: true },
  { cond: "status == 'urgent'", vars: { status: 'normal' }, expected: false },
  { cond: "days < 5 && type == 'A'", vars: { days: 3, type: 'A' }, expected: true },
  { cond: "days < 5 && type == 'A'", vars: { days: 6, type: 'A' }, expected: false },
  { cond: "days < 5 && type == 'A'", vars: { days: 3, type: 'B' }, expected: false },
  { cond: "missing_var > 10", vars: { amount: 100 }, expected: false }, // Should catch error and return false
];

console.log("Running tests...");
tests.forEach((t, i) => {
  const res = evaluateCondition(t.cond, t.vars);
  console.log(`Test ${i + 1}: ${t.cond} | Vars: ${JSON.stringify(t.vars)} | Expected: ${t.expected} | Got: ${res} | ${res === t.expected ? "✅" : "❌"}`);
});
