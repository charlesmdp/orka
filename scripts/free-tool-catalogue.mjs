import { mathTools } from '../public/tools-math.js';
import { writingTools } from '../public/tools-writing.js';
import { siteTools } from '../public/tools-sites.js';

export const toolGroups = [
  {name: 'Live chat', id: 'live-chat'},
  {name: 'Knowledge base', id: 'knowledge-base'},
  {name: 'Support operations', id: 'support-operations'},
  {name: 'Ecommerce', id: 'ecommerce'},
  {name: 'AI & writing', id: 'ai-and-writing'}
];
export const tools = [...siteTools, ...mathTools, ...writingTools];
export const toolSlugs = ['free-tools', ...tools.map(tool => tool.slug)];
export const updated = '2026-11-09';

export function toolFamily(tool) {
  if (mathTools.includes(tool)) return 'math';
  if (writingTools.includes(tool)) return 'writing';
  return 'sites';
}
