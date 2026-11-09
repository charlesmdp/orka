import test from 'node:test';
import assert from 'node:assert/strict';
import { mathTools } from '../public/tools-math.js';

function calculate(slug, overrides = {}) {
  const tool = mathTools.find(candidate => candidate.slug === slug);
  const sample = Object.fromEntries(tool.fields.map(field => [field.key, field.value]));
  return tool.run({ ...sample, ...overrides });
}

test('each calculator reproduces its published example and validates required fields', () => {
  const results = [
    ['live-chat-staffing-calculator', 'Schedule 5 agents'],
    ['cost-per-support-ticket-calculator', '$6.00 per resolved ticket'],
    ['support-backlog-calculator', '14 working days to clear the queue'],
    ['first-response-time-calculator', '8 minutes median first response time'],
    ['wismo-calculator', '$960.00 in monthly WISMO labor'],
    ['black-friday-support-forecast', 'About 600 campaign tickets'],
    ['ecommerce-contact-rate-calculator', '8 tickets per 100 orders'],
    ['ai-support-cost-calculator', '$36.00 estimated monthly model cost']
  ];
  for (const [slug, headline] of results) {
    const tool = mathTools.find(candidate => candidate.slug === slug);
    assert.equal(calculate(slug).headline, headline);
    assert.throws(() => calculate(slug, { [tool.fields[0].key]: '' }));
    assert.throws(() => calculate(slug, { [tool.fields[0].key]: 'invalid' }));
  }
});

test('staffing rounds online headcount up before accounting for time away', () => {
  const result = calculate('live-chat-staffing-calculator', { chats: '37' });
  assert.equal(result.headline, 'Schedule 7 agents');
  assert.match(result.body, /5 agents needed online/);
  assert.throws(() => calculate('live-chat-staffing-calculator', { shrinkage: '100' }));
  assert.throws(() => calculate('live-chat-staffing-calculator', { chats: '2.5' }));
});

test('cost and backlog distinguish zero volume, steady and overloaded queues', () => {
  assert.throws(() => calculate('cost-per-support-ticket-calculator', { tickets: '0' }));
  assert.equal(calculate('support-backlog-calculator', { open: '0', resolvedDaily: '0' }).headline, 'Your starting backlog is clear');
  assert.equal(calculate('support-backlog-calculator', { resolvedDaily: '80' }).headline, 'The backlog stays level');
  assert.equal(calculate('support-backlog-calculator', { resolvedDaily: '50' }).headline, 'The backlog is growing');
  assert.equal(calculate('support-backlog-calculator', { open: '2', newDaily: '1.5', resolvedDaily: '2.25' }).headline, '3 working days to clear the queue');
});

test('decimal workload and spare capacity round up only for a genuine partial unit', () => {
  const backlog = 'support-backlog-calculator';
  assert.equal(calculate(backlog, { open: '1', newDaily: '0.2', resolvedDaily: '0.3' }).headline, '10 working days to clear the queue');
  assert.equal(calculate(backlog, { open: '1', newDaily: '1000.2', resolvedDaily: '1000.3' }).headline, '10 working days to clear the queue');
  assert.equal(calculate(backlog, { open: '1', newDaily: '0.2', resolvedDaily: '0.2999999999999999' }).headline, '11 working days to clear the queue');
  assert.equal(calculate(backlog, { open: '1', newDaily: '2e-6', resolvedDaily: '3e-6' }).headline, '1,000,000 working days to clear the queue');
  const staffing = 'live-chat-staffing-calculator';
  assert.equal(calculate(staffing, { shrinkage: '80' }).headline, 'Schedule 20 agents');
  assert.equal(calculate(staffing, { chats: '1', minutes: '60', simultaneous: '1', occupancy: '100', shrinkage: '0' }).headline, 'Schedule 1 agent');
});

test('response times normalize offsets, count unanswered tickets and support spreadsheet columns', () => {
  const rows = 'created_at\tfirst_reply_at\n"2026-11-01T01:55:00-04:00"\t"2026-11-01T01:00:00-05:00"\n2026-11-01T06:00Z\t2026-11-01T06:09Z\n2026-11-01T06:03Z,';
  const r = calculate('first-response-time-calculator', { rows });
  assert.equal(r.headline, '7 minutes median first response time');
  assert.match(r.body, /90th percentile: 9 minutes/);
  assert.match(r.body, /2 answered tickets and 1 unanswered ticket/);
  assert.match(r.body, /05:00 UTC — 5 minutes/);
  assert.match(r.body, /06:00 UTC — 9 minutes/);
  const unanswered = calculate('first-response-time-calculator', { rows: '2026-11-01T06:03Z,' });
  assert.match(unanswered.body, /1 unanswered ticket/);
});

test('response times flag invalid timestamps and impossible response sequences', () => {
  const received = '2026-11-01T06:03Z';
  for (const rows of [
    'received_at,first_reply_at',
    '2026-02-30T01:00Z,2026-03-04T01:00Z',
    '2026-11-01T06:03,' + received,
    received + ',2026-11-01T06:02Z',
    received + ',' + received + ',' + received,
    received + ',missing'
  ]) assert.throws(() => calculate('first-response-time-calculator', { rows }));
});

test('WISMO costs and forecasts handle repeat tickets and validate the peak-day assumption', () => {
  assert.match(calculate('wismo-calculator', { orders: '100', rate: '110', minutes: '6', hourly: '10' }).headline, /\$110\.00/);
  assert.match(calculate('black-friday-support-forecast').body, /240 tickets and 28 agent hours/);
  assert.throws(() => calculate('black-friday-support-forecast', { days: '2', peak: '40' }), /at least one average day/);
});

test('contact-rate periods can be optional or zero and may exceed 100 tickets per 100 orders', () => {
  assert.match(calculate('ecommerce-contact-rate-calculator').body, /down by 2 tickets per 100 orders/);
  const single = calculate('ecommerce-contact-rate-calculator', { tickets: '10', orders: '8', previousOrders: '', previousTickets: '' });
  assert.equal(single.headline, '125 tickets per 100 orders');
  assert.throws(() => calculate('ecommerce-contact-rate-calculator', { previousOrders: '' }), /both comparison/);
  assert.match(calculate('ecommerce-contact-rate-calculator', { previousTickets: '0' }).body, /up by 8 tickets/);
});

test('AI costs respect separate prices for input and output', () => {
  assert.match(calculate('ai-support-cost-calculator').body, /\$0\.0036 per conversation/);
  assert.match(calculate('ai-support-cost-calculator', { inputRate: '0', outputRate: '0.50' }).headline, /\$1\.50 /);
  assert.match(calculate('ai-support-cost-calculator', { conversations: '0' }).headline, /\$0\.00 /);
});
