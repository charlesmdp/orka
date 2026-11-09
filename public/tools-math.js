// Each tool uses the same field definitions for the form and for validation.
const english = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const dollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function numberField(key, label, value, settings = {}) {
  return { key, label, type: 'number', value: String(value), min: 0, max: 1e9, step: 'any', ...settings };
}

function countField(key, label, value, settings = {}) {
  return numberField(key, label, value, { step: 1, ...settings });
}

function numbers(fields, values) {
  const parsed = {};
  for (const field of fields) {
    const raw = String(values[field.key] ?? '').trim();
    if (!raw && field.optional) continue;
    if (!raw) throw new Error('Enter a value for ' + field.label.toLowerCase() + '.');
    const value = Number(raw);
    if (!Number.isFinite(value) || value < field.min || value > field.max || (field.step === 1 && !Number.isInteger(value))) {
      const kind = field.step === 1 ? 'whole number' : 'number';
      throw new Error(field.label + ' must be a ' + kind + ' between ' + field.min + ' and ' + english.format(field.max) + '.');
    }
    parsed[field.key] = value;
  }
  return parsed;
}

function plural(value, singular, multiple = singular + 's') {
  return english.format(value) + ' ' + (value === 1 || value === 1n ? singular : multiple);
}

// Keep decimal rates in common integer units when a fraction of a person or
// working day must be rounded up. This also supports scientific notation.
function decimalUnits(values) {
  const parts = values.map(value => {
    const [mantissa, exponent = '0'] = String(value).split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    return { digits: BigInt(whole + fraction), places: fraction.length - Number(exponent) };
  });
  const precision = Math.max(0, ...parts.map(part => part.places));
  return parts.map(part => part.digits * 10n ** BigInt(precision - part.places));
}

function ceilDivision(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

const staffingFields = [
  countField('chats', 'New chats in your busiest hour', 36),
  numberField('minutes', 'Average chat duration (minutes)', 10, { min: 0.01, max: 1440, hint: 'Use elapsed time while an agent is handling the conversation.' }),
  numberField('simultaneous', 'Average chats handled at once per agent', 2, { min: 1, max: 50 }),
  numberField('occupancy', 'Target occupancy (%)', 75, { min: 0.01, max: 100, hint: 'The share of available time agents spend handling chats.' }),
  numberField('shrinkage', 'Scheduled time away from the inbox (%)', 20, { max: 99.99, hint: 'Include breaks, meetings and training.' })
];
const staffing = {
  slug: 'live-chat-staffing-calculator',
  name: 'Live Chat Staffing Calculator',
  title: 'Free Live Chat Staffing Calculator for Support Teams',
  description: 'Estimate how many live chat agents to schedule in your busiest hour using chat volume, concurrency, occupancy and time away from the inbox.',
  category: 'Support operations',
  intro: 'Estimate the number of agents you need online in a busy hour and the number to put on the schedule once breaks and meetings are included.',
  fields: staffingFields, button: 'Calculate staffing',
  run(values) {
    const { chats, minutes, simultaneous, occupancy, shrinkage } = numbers(staffingFields, values);
    const workload = chats * minutes;
    const capacity = 60 * simultaneous * occupancy / 100;
    const [duration, concurrency, occupancyPct, timeAwayPct, hundredPct] = decimalUnits([minutes, simultaneous, occupancy, shrinkage, 100]);
    const online = ceilDivision(BigInt(chats) * duration * hundredPct, 60n * concurrency * occupancyPct);
    const scheduled = ceilDivision(online * hundredPct, hundredPct - timeAwayPct);
    return {
      headline: 'Schedule ' + plural(scheduled, 'agent'),
      body: plural(online, 'agent') + ' needed online during the busiest hour. ' + english.format(workload) + ' chat-minutes arrive in that hour. Each available agent covers about ' + english.format(capacity) + ' chat-minutes at your concurrency and occupancy targets.'
    };
  },
  method: 'Multiply new chats per hour by the average elapsed handling time. Divide that workload by 60 minutes, average simultaneous chats and the occupancy fraction. Round up to a whole number of online agents. Divide that count by the share of scheduled time available for chat, then round up again.',
  example: '36 chats lasting 10 minutes generate 360 chat-minutes in one hour. At two simultaneous chats and 75% occupancy, one online agent covers 90 chat-minutes. You need four online, or five on the schedule when 20% of scheduled time goes to breaks and meetings.',
  faqs: [
    ['How do I measure live chat concurrency?', 'During representative busy intervals, divide the total minutes conversations were actively assigned by the minutes agents spent handling at least one chat. Use the resulting average, which can be fractional.'],
    ['Which duration should I enter for asynchronous conversations?', 'Use the active part of the conversation during which a chat occupies an agent’s capacity. Exclude overnight gaps and long stretches waiting for a customer. If you measure hands-on agent minutes instead, enter a concurrency of one.'],
    ['Will this headcount guarantee a first response target?', 'This calculation estimates workload capacity over an hour. Arrivals clustered into a few minutes can still produce a queue. Check the estimate against real arrival patterns and observed wait times before finalizing shifts.']
  ],
  related: ['support-backlog-calculator', 'first-response-time-calculator']
};

const ticketCostFields = [
  numberField('people', 'Monthly support labor (USD)', 12000),
  numberField('software', 'Monthly support software (USD)', 800),
  numberField('other', 'Other monthly support costs (USD)', 400),
  countField('tickets', 'Tickets resolved in the same month', 2200, { min: 1 })
];
const ticketCost = {
  slug: 'cost-per-support-ticket-calculator', name: 'Cost per Support Ticket Calculator',
  title: 'Free Cost per Support Ticket Calculator',
  description: 'Calculate support cost per resolved ticket from monthly labor, software and overhead. See the individual contribution of each cost category.',
  category: 'Support operations',
  intro: 'Find the average cost of resolving one support ticket. Enter expenses and resolutions for the same team and calendar month.',
  fields: ticketCostFields, button: 'Calculate cost per ticket',
  run(values) {
    const { people, software, other, tickets } = numbers(ticketCostFields, values);
    const total = people + software + other;
    return {
      headline: dollars.format(total / tickets) + ' per resolved ticket',
      body: dollars.format(total) + ' across ' + plural(tickets, 'resolution') + '. Each ticket accounts for ' + dollars.format(people / tickets) + ' in labor, ' + dollars.format(software / tickets) + ' in software and ' + dollars.format(other / tickets) + ' in other expenses, on average.'
    };
  },
  method: 'Add the monthly cost of the people who handle support, their tools and the overhead you allocate to the team. Divide by the count of distinct tickets resolved during that month. Keeping the team, period and resolution definition consistent makes month-to-month comparisons easier.',
  example: '$12,000 in labor, $800 in software and $400 in other costs add up to $13,200. Dividing by 2,200 resolved tickets gives $6.00 per ticket.',
  faqs: [
    ['What belongs in support labor costs?', 'Include wages, employer contributions and contractor invoices for time spent on support. For a founder or engineer who handles support part time, use the support share of their time.'],
    ['Should I include AI-resolved tickets?', 'Include them when calculating a blended cost across human and automated support, and include AI usage fees in expenses. For a human-only figure, filter both expenses and resolutions to the human queue.'],
    ['How should I count reopened tickets?', 'Count each distinct ticket once under your chosen resolution rule. For example, assign it to the month of its final resolution and use the same rule each month.']
  ],
  related: ['wismo-calculator', 'ai-support-cost-calculator']
};

const backlogFields = [
  countField('open', 'Open tickets now', 420),
  numberField('newDaily', 'Average new tickets per working day', 80),
  numberField('resolvedDaily', 'Average resolutions per working day', 110)
];
const backlog = {
  slug: 'support-backlog-calculator', name: 'Support Backlog Calculator',
  title: 'Free Support Backlog Clearance Calculator',
  description: 'Estimate how many working days it takes to clear your ticket backlog while new tickets arrive. Compare daily arrivals with resolution capacity.',
  category: 'Support operations',
  intro: 'See how long your open queue will take to clear at your current pace, including the new requests your team receives while working through it.',
  fields: backlogFields, button: 'Forecast the backlog',
  run(values) {
    const { open, newDaily, resolvedDaily } = numbers(backlogFields, values);
    const net = resolvedDaily - newDaily;
    if (!open) return {
      headline: 'Your starting backlog is clear',
      body: net < 0 ? 'At these rates, ' + plural(-net, 'ticket') + ' will accumulate per working day.' : 'Current daily resolution capacity covers the incoming volume.'
    };
    if (net <= 0) return {
      headline: net === 0 ? 'The backlog stays level' : 'The backlog is growing',
      body: net === 0 ? 'The team resolves as many tickets as arrive. Clearing the ' + plural(open, 'open ticket') + ' requires additional daily capacity.' : plural(-net, 'additional ticket') + ' per working day will join your current queue of ' + english.format(open) + '. Daily resolutions need to exceed ' + english.format(newDaily) + ' for the queue to shrink.'
    };
    const [startingTickets, arrivals, completions] = decimalUnits([open, newDaily, resolvedDaily]);
    const days = ceilDivision(startingTickets, completions - arrivals);
    return { headline: plural(days, 'working day') + ' to clear the queue', body: 'After covering incoming volume, ' + plural(net, 'resolution') + ' per working day can go toward the ' + plural(open, 'open ticket') + '.' };
  },
  method: 'Subtract average new tickets per working day from average resolutions per working day. Divide today’s open backlog by this spare capacity and round up to the next working day. When arrivals equal or exceed resolutions, the model reports a level or growing queue.',
  example: 'A team starts with 420 open tickets. With 80 new tickets and 110 resolutions per working day, it can clear 30 old tickets a day. The estimated clearance time is 420 ÷ 30, or 14 working days.',
  faqs: [
    ['How should weekend tickets be counted?', 'If your team works five days and tickets arrive all week, divide total weekly arrivals by five. For example, 350 weekly arrivals become 70 per working day.'],
    ['Can I use fractional daily averages?', 'Yes. Ten days with 113 total resolutions gives an average of 11.3 a day. Keep fractions in both rates so rounding does not distort a small queue.'],
    ['What if some open tickets are waiting for customers?', 'Choose an operational definition before counting. For an actionable backlog, count only open work agents can handle and use daily rates for tickets entering and leaving that same queue.']
  ],
  related: ['live-chat-staffing-calculator', 'black-friday-support-forecast']
};

const firstReplySample = 'received_at,first_reply_at\n2026-10-05T09:00:00Z,2026-10-05T09:04:00Z\n2026-10-05T10:00:00Z,2026-10-05T10:08:00Z\n2026-10-05T10:20:00Z,2026-10-05T10:38:00Z\n2026-10-05T11:05:00Z,';
function timestamp(raw, line) {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/i.exec(raw);
  const time = match && Date.parse(raw.replace(' ', 'T'));
  // Date.parse normalizes some invalid calendar dates such as February 30.
  const midnight = match && Date.parse(match[1] + 'T00:00:00Z');
  if (!match || !Number.isFinite(time) || !Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== match[1] || Number(match[2]) > 23) {
    throw new Error('Row ' + line + ' needs a valid timestamp with a timezone, such as 2026-10-05T09:00:00Z.');
  }
  return time;
}
function elapsed(minutes) {
  if (minutes > 0 && minutes < 1) return plural(Math.round(minutes * 600) / 10, 'second');
  return plural(minutes, 'minute');
}
function calculateFirstReply(values) {
  const input = String(values.rows ?? '').trim();
  if (!input) throw new Error('Paste the received and first reply timestamps for at least one ticket.');
  const lines = input.split(/\r?\n/);
  if (lines.length > 10001) throw new Error('Use a maximum of 10,000 tickets per calculation.');
  const durations = [];
  const hours = new Map();
  let unanswered = 0;
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const cells = line.split(/[,\t;]/).map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
    if (!index && cells.length === 2 && /^(received_at|created_at)$/i.test(cells[0]) && /^(replied_at|first_reply_at)$/i.test(cells[1])) continue;
    if (cells.length !== 2) throw new Error('Row ' + (index + 1) + ' needs two columns. Leave the second column blank for an unanswered ticket.');
    const created = timestamp(cells[0], index + 1);
    if (!cells[1]) { unanswered++; continue; }
    const replied = timestamp(cells[1], index + 1);
    if (replied < created) throw new Error('The first reply in row ' + (index + 1) + ' comes before the ticket arrived.');
    const duration = (replied - created) / 60000;
    durations.push(duration);
    const hour = new Date(created).getUTCHours();
    const entry = hours.get(hour) || { count: 0, total: 0 };
    entry.count++; entry.total += duration; hours.set(hour, entry);
  }
  if (durations.length === 0) {
    if (!unanswered) throw new Error('Add at least one ticket below the header.');
    return { headline: 'No first replies recorded', body: plural(unanswered, 'unanswered ticket') + '. A response time can be measured once a reply is recorded.' };
  }
  durations.sort((a, b) => a - b);
  const middle = Math.floor(durations.length / 2);
  const median = durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2;
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const p90 = durations[Math.ceil(durations.length * 0.9) - 1];
  const hourly = [...hours.entries()].sort(([a], [b]) => a - b).map(([hour, bucket]) => String(hour).padStart(2, '0') + ':00 UTC — ' + elapsed(bucket.total / bucket.count) + ' (' + plural(bucket.count, 'reply', 'replies') + ')');
  return {
    headline: elapsed(median) + ' median first response time',
    body: 'Mean: ' + elapsed(average) + '. 90th percentile: ' + elapsed(p90) + '. Sample: ' + plural(durations.length, 'answered ticket') + ' and ' + plural(unanswered, 'unanswered ticket') + '.\n\nAverage by arrival hour\n' + hourly.join('\n')
  };
}
const firstReply = {
  slug: 'first-response-time-calculator', name: 'First Response Time Calculator',
  title: 'Free First Response Time Calculator for Support Tickets',
  description: 'Paste two timestamp columns to calculate mean, median and 90th-percentile first response time. See unanswered tickets and results by arrival hour.',
  category: 'Support operations',
  intro: 'Measure the elapsed time between a customer’s first message and the first public agent reply. Paste timestamps from your ticket export to see the typical wait and the slower end of the queue.',
  fields: [{ key: 'rows', label: 'Received and first reply timestamps', type: 'textarea', value: firstReplySample, hint: 'Two columns per ticket, separated by a comma, semicolon or tab. Include Z or a UTC offset. A blank second cell means unanswered. Up to 10,000 tickets.' }],
  button: 'Analyze response times', run: calculateFirstReply,
  method: 'Subtract the received timestamp from the first reply timestamp for each answered ticket. The mean uses all measured waits. The median is the middle wait, averaging the two middle values for an even sample. The 90th percentile uses the nearest-rank method. Hourly averages group answered tickets by their UTC arrival hour.',
  example: 'Three tickets receive replies after 4, 8 and 18 minutes. Their median is 8 minutes, their mean is 10 minutes and their nearest-rank 90th percentile is 18 minutes. A fourth ticket with an empty reply cell appears in the unanswered count.',
  faqs: [
    ['Which reply should I use from my help desk export?', 'For human first response time, use the first public human reply. Keep internal notes and automatic acknowledgments out of the reply column. For a bot-inclusive report, apply that definition consistently across the entire sample.'],
    ['Does first response time include nights and weekends?', 'This calculator measures elapsed clock time, including nights and weekends. A separate business-hours metric requires your support schedule and holiday calendar.'],
    ['Can I paste timestamps from different time zones?', 'Yes. Include an explicit timezone in each cell, using Z or an offset such as -05:00. Durations are compared on the same timeline, and the hourly breakdown uses UTC.']
  ],
  related: ['live-chat-staffing-calculator', 'support-backlog-calculator']
};

const wismoFields = [
  countField('orders', 'Orders per month', 5000),
  numberField('rate', 'Tracking inquiries per 100 orders', 6, { max: 10000 }),
  numberField('minutes', 'Agent minutes per tracking inquiry', 8, { max: 1440 }),
  numberField('hourly', 'Fully loaded hourly agent cost (USD)', 24)
];
const wismo = {
  slug: 'wismo-calculator', name: 'WISMO Calculator',
  title: 'Free WISMO Calculator for Order Tracking Support Costs',
  description: 'Estimate how many “where is my order?” requests your store receives, how many agent hours they take and the monthly labor cost of tracking inquiries.',
  category: 'Ecommerce',
  intro: 'WISMO stands for “where is my order?” Use your store’s order volume and tracking inquiry rate to estimate the monthly workload and labor cost of answering delivery questions.',
  fields: wismoFields, button: 'Calculate WISMO cost',
  run(values) {
    const { orders, rate, minutes, hourly } = numbers(wismoFields, values);
    const tickets = orders * rate / 100;
    const hours = tickets * minutes / 60;
    return { headline: dollars.format(hours * hourly) + ' in monthly WISMO labor', body: plural(tickets, 'estimated tracking inquiry', 'estimated tracking inquiries') + ' per month, using ' + plural(hours, 'agent hour') + '. Labor per inquiry is ' + dollars.format(minutes * hourly / 60) + '.' };
  },
  method: 'Multiply monthly orders by the number of tracking inquiries per 100 orders and divide by 100. Multiply the estimated inquiry count by agent minutes per inquiry and divide by 60 to get labor hours. Multiply hours by your loaded hourly cost to estimate monthly spend.',
  example: 'With 5,000 orders and six tracking inquiries per 100 orders, you can expect 300 inquiries. At eight agent minutes each, that is 40 hours. At $24 per hour, the estimated monthly labor cost is $960.',
  faqs: [
    ['How do I find my store’s WISMO rate?', 'Count tracking and delivery-status conversations over a representative period. Divide that count by orders placed in the period and multiply by 100. Allow for shipping lead times when a sale creates a large spike.'],
    ['How do I handle follow-up messages in the same ticket?', 'Count the conversation once and include the handling time for its follow-ups. If your reporting counts distinct reopened inquiries, use average handling time for that same unit.'],
    ['Can I estimate the savings from proactive tracking?', 'Run the calculator once with your measured rate, then again with a lower rate supported by a pilot. The difference estimates labor capacity freed. Deduct any added messaging and software costs when comparing spend.']
  ],
  related: ['ecommerce-contact-rate-calculator', 'cost-per-support-ticket-calculator']
};

const forecastFields = [
  countField('orders', 'Expected campaign orders', 5000),
  numberField('rate', 'Support tickets per 100 orders', 12, { max: 10000 }),
  countField('days', 'Days in the support window', 4, { min: 1, max: 366, hint: 'Include post-sale days if your estimate includes delivery or returns inquiries.' }),
  numberField('peak', 'Share of tickets on the busiest day (%)', 40, { min: 0.01, max: 100 }),
  numberField('minutes', 'Hands-on agent minutes per ticket', 7, { max: 1440 })
];
const forecast = {
  slug: 'black-friday-support-forecast', name: 'Black Friday Support Forecast',
  title: 'Black Friday Support Ticket Volume Forecast Calculator',
  description: 'Forecast Black Friday and Cyber Monday support volume from expected orders. Estimate the busiest day, daily ticket average and hands-on agent hours.',
  category: 'Ecommerce',
  intro: 'Plan support coverage for Black Friday and Cyber Monday using expected orders, your historical ticket rate and the share of demand that lands on your busiest day.',
  fields: forecastFields, button: 'Forecast support demand',
  run(values) {
    const { orders, rate, days, peak, minutes } = numbers(forecastFields, values);
    if (peak / 100 < 1 / days - 1e-10) throw new Error('The busiest day must account for at least one average day. Increase its share to ' + (Math.ceil(10000 / days) / 100) + '% or more.');
    const tickets = orders * rate / 100;
    const peakTickets = tickets * peak / 100;
    return {
      headline: 'About ' + plural(Math.round(tickets), 'campaign ticket'),
      body: 'Daily average: ' + plural(tickets / days, 'ticket') + '. Busiest day: about ' + plural(Math.round(peakTickets), 'ticket') + ' and ' + plural(peakTickets * minutes / 60, 'agent hour') + ' of handling work. Total handling across the campaign: ' + plural(tickets * minutes / 60, 'hour') + '.'
    };
  },
  method: 'Estimate tickets by multiplying expected campaign orders by your historical tickets per 100 orders and dividing by 100. Divide by the number of days for average daily volume. Multiply the total by the busiest day’s share for peak volume, then convert average hands-on minutes per ticket to agent hours.',
  example: '5,000 BFCM orders at 12 tickets per 100 orders imply 600 tickets. Across four days, that averages 150 a day. If 40% arrive on the busiest day, expect 240 that day. Seven minutes per ticket makes 28 hours of hands-on work on that day.',
  faqs: [
    ['How can I estimate the busiest day’s share?', 'For a comparable past promotion, divide the highest single-day ticket count by tickets across the full support window. Use a longer window when shipping delays or returns generate a second wave.'],
    ['How do I account for presale questions?', 'If your historical ticket count included presale conversations, the rate already reflects them. Otherwise forecast presale contacts separately and add their workload to your staffing plan.'],
    ['How do I convert agent hours into a schedule?', 'Divide the workload by the productive support hours available in a shift. Account for breaks, shift overlap and the timing of ticket arrivals when assigning start times.']
  ],
  related: ['ecommerce-contact-rate-calculator', 'live-chat-staffing-calculator', 'wismo-calculator']
};

const contactFields = [
  countField('orders', 'Orders in this period', 1800, { min: 1 }),
  countField('tickets', 'Support tickets in this period', 144),
  countField('previousOrders', 'Orders in comparison period', 1500, { min: 1, optional: true }),
  countField('previousTickets', 'Tickets in comparison period', 150, { optional: true })
];
const contact = {
  slug: 'ecommerce-contact-rate-calculator', name: 'Ecommerce Contact Rate Calculator',
  title: 'Free Ecommerce Customer Contact Rate Calculator',
  description: 'Calculate support tickets per 100 orders. Compare two stores or periods and see how contact rate changes as order volume grows.',
  category: 'Ecommerce',
  intro: 'Measure how many support conversations your store receives for every 100 orders. Add a second period to see whether the workload per order is rising or falling.',
  fields: contactFields, button: 'Calculate contact rate',
  run(values) {
    const { orders, tickets, previousOrders, previousTickets } = numbers(contactFields, values);
    if ((previousOrders === undefined) !== (previousTickets === undefined)) throw new Error('Enter both comparison values or leave both comparison fields empty.');
    const rate = tickets / orders * 100;
    const headline = english.format(rate) + ' tickets per 100 orders';
    if (previousOrders === undefined) return { headline, body: english.format(tickets) + ' tickets across ' + plural(orders, 'order') + '. Add another period or store for a comparison.' };
    const comparison = previousTickets / previousOrders * 100;
    const difference = rate - comparison;
    const direction = difference > 0 ? 'up' : 'down';
    const change = difference === 0 ? 'The rates are equal.' : 'The current rate is ' + direction + ' by ' + english.format(Math.abs(difference)) + ' tickets per 100 orders.';
    return { headline, body: 'Comparison period: ' + english.format(comparison) + ' tickets per 100 orders. ' + change };
  },
  method: 'Divide distinct support tickets by orders over the same reporting period, then multiply by 100. For two periods or stores, calculate each ratio separately. Subtract the comparison rate from the current rate to measure the change in tickets per 100 orders.',
  example: '144 support tickets for 1,800 orders equal eight tickets per 100 orders. The previous period had 150 tickets for 1,500 orders, or ten per 100. The current period generated two fewer tickets for every 100 orders.',
  faqs: [
    ['Can the contact rate exceed 100?', 'Yes. An order can generate several distinct conversations, and some tickets may come from shoppers before a purchase. The result measures tickets per 100 orders.'],
    ['Should I count messages or conversations?', 'Use distinct tickets or conversations. Counting every message makes long exchanges inflate the rate and makes stores with different reply habits difficult to compare.'],
    ['Can I compare two Shopify stores?', 'Yes. Enter one store in each pair of fields. Match the channels, ticket definitions and reporting windows so that a difference reflects customer demand rather than reporting rules.']
  ],
  related: ['wismo-calculator', 'black-friday-support-forecast']
};

const aiCostFields = [
  countField('conversations', 'AI-assisted conversations per month', 10000),
  countField('inputTokens', 'Billed input tokens per conversation', 2400, { hint: 'Sum the input across model calls, including repeated context.' }),
  countField('outputTokens', 'Billed output tokens per conversation', 300),
  numberField('inputRate', 'Input price per million tokens (USD)', 1),
  numberField('outputRate', 'Output price per million tokens (USD)', 4)
];
const aiCost = {
  slug: 'ai-support-cost-calculator', name: 'AI Support Cost Calculator',
  title: 'Free AI Customer Support Cost Calculator by Token Usage',
  description: 'Estimate monthly AI support spend and cost per conversation using your model’s input and output token prices, message usage and monthly volume.',
  category: 'AI & writing',
  intro: 'Estimate model usage costs for customer support using your own token prices. Enter the tokens billed over an entire conversation, including any calls that search knowledge or draft a follow-up.',
  fields: aiCostFields, button: 'Estimate AI usage cost',
  run(values) {
    const { conversations, inputTokens, outputTokens, inputRate, outputRate } = numbers(aiCostFields, values);
    const input = inputTokens * inputRate / 1e6;
    const output = outputTokens * outputRate / 1e6;
    const unit = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 8 }).format(input + output);
    return {
      headline: dollars.format((input + output) * conversations) + ' estimated monthly model cost',
      body: unit + ' per conversation at the entered rates. Monthly input costs ' + dollars.format(input * conversations) + ' and output costs ' + dollars.format(output * conversations) + '. Tokens billed per month: ' + english.format(inputTokens * conversations) + ' input and ' + english.format(outputTokens * conversations) + ' output.'
    };
  },
  method: 'Multiply billed input tokens per conversation by the input rate per million tokens and divide by one million. Repeat for output tokens at the output rate. Add both amounts for unit cost and multiply by monthly AI-assisted conversations. Prices in the example are illustrative USD rates.',
  example: 'At $1 per million input tokens and $4 per million output tokens, 2,400 input tokens cost $0.0024 and 300 output tokens cost $0.0012. That is $0.0036 per conversation, or $36 for 10,000 conversations.',
  faqs: [
    ['Where should I get my model’s token prices?', 'Use the rates for your model and billing tier from the provider’s pricing page or your latest invoice. Enter each price in US dollars per one million tokens.'],
    ['Why does a long conversation use more input tokens?', 'Many applications send prior messages, instructions and retrieved knowledge back to the model on subsequent turns. Sum billed input across those calls or use the mean total from a representative usage export.'],
    ['How do caching discounts and other charges affect this estimate?', 'For cached and uncached input, enter their effective blended input rate from a representative billing period. Add search fees, storage, platform subscriptions and taxes separately when planning an overall budget.']
  ],
  related: ['cost-per-support-ticket-calculator', 'live-chat-staffing-calculator']
};

export const mathTools = [staffing, ticketCost, backlog, firstReply, wismo, forecast, contact, aiCost];
