// Editorial planning model, not Orka's architecture, costs or a vendor quote.
export const costReviewDate = '2026-10-12';
export const sources = {
 workers:['Cloudflare Workers pricing','https://developers.cloudflare.com/workers/platform/pricing/'],
 realtime:['Durable Objects pricing','https://developers.cloudflare.com/durable-objects/platform/pricing/'],
 hibernation:['WebSocket hibernation','https://developers.cloudflare.com/durable-objects/best-practices/websockets/'],
 database:['D1 pricing','https://developers.cloudflare.com/d1/platform/pricing/'],
 storage:['R2 pricing','https://developers.cloudflare.com/r2/pricing/'],
 queues:['Queues pricing','https://developers.cloudflare.com/queues/platform/pricing/'],
 vectors:['Vectorize pricing','https://developers.cloudflare.com/vectorize/platform/pricing/'],
 resend:['Resend pricing','https://resend.com/pricing'],
 receiving:['Resend receiving email','https://resend.com/docs/dashboard/receiving/introduction'],
 postmark:['Postmark pricing','https://postmarkapp.com/pricing'],
 inbound:['Postmark inbound webhooks','https://postmarkapp.com/developer/webhooks/inbound-webhook'],
 geo:['Cloudflare geolocation fields','https://developers.cloudflare.com/workers/examples/geolocation-hello-world/'],
 ipbase:['ipbase pricing','https://ipbase.com/pricing/'],
 maps:['Mapbox pricing','https://www.mapbox.com/pricing'],
 push:['Firebase pricing','https://firebase.google.com/pricing'],
 expo:['Expo pricing','https://expo.dev/pricing'],
 apple:['Apple developer membership','https://developer.apple.com/help/account/basics/about-your-developer-account'],
 android:['Google Play registration','https://support.google.com/googleplay/android-developer/answer/6112435?hl=en'],
 openai:['OpenAI API pricing','https://developers.openai.com/api/docs/pricing'],
 embeddings:['OpenAI embedding model pricing','https://developers.openai.com/api/docs/models/text-embedding-3-small'],
 anthropic:['Anthropic API pricing','https://platform.claude.com/docs/en/about-claude/pricing'],
 openrouter:['OpenRouter pricing','https://openrouter.ai/pricing'],
 turnstile:['Turnstile plans','https://developers.cloudflare.com/turnstile/plans/'],
 sockets:['OWASP WebSocket security','https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html'],
 ssrf:['OWASP SSRF prevention','https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html']
};
export const vendorCosts = [
 ['Hosting, CDN & API','Workers Paid: $5/month minimum. Includes 10M requests and 30M CPU-ms; then $0.30/M requests and $0.02/M CPU-ms. Static asset requests are free.','One account-level baseline, not $5 for each feature.','workers'],
 ['Real-time connections','Durable Objects Paid allowance: 1M requests and 400,000 GB-s/month. Extra usage: $0.15/M requests and $12.50/M GB-s, with billing-unit rounding.','Incoming WebSocket messages use a 20:1 billing ratio. Outgoing messages are not charged as requests. Connection setup and active duration still count. Durable Object SQLite storage includes 5 GB on Paid, then $0.20/GB-month; row reads and writes have their own allowances.','realtime'],
 ['Conversation database','D1 Paid includes 5 GB, 25B rows read and 50M rows written/month; above that: $0.75/GB-month, $0.001/M reads, $1/M writes.','Index writes, searches and analytics consume database operations too. SQLite storage inside Durable Objects has a separate meter; do not confuse it with D1.','database'],
 ['Files, images & backup objects','R2 Standard: 10 GB-month, 1M Class A and 10M Class B operations/month free; then $0.015/GB-month, $4.50/M A, $0.36/M B. Internet egress is free.','Budget for retained files, thumbnails, exports and backup copies. Scanning and transformations need compute as well.','storage'],
 ['Jobs, reminders & retries','Queues Paid includes 1M operations/month, then $0.40/M. A small successful job normally uses 3 operations.','Retries and messages larger than 64 KB add operations; consumers also use Workers compute.','queues'],
 ['Transactional email: Resend','Free: 3,000 emails/month, maximum 100/day. Pro: $20/month for 50,000; additional buckets of 1,000 cost $0.90.','Sending and receiving share the quota. Count follow-ups, inbound replies, invitations, password resets and notification fan-out.','resend'],
 ['Transactional email: Postmark','At 10,000 emails/month: Basic $15, Pro $16.50, Platform $18. Pro includes inbound processing; overage $1.30/1,000.','An alternative to Resend, not another required subscription. For replies-by-email compare an inbound-capable plan.','postmark'],
 ['Visitor geolocation','Use Workers request.cf city, country, latitude and longitude with no separate geolocation API subscription.','That is approximate IP location, not GPS or a verified customer address. Use trusted edge metadata, not a client-supplied IP.','geo'],
 ['Optional enrichment: ipbase','Free: 150 lookups/month. Small: $9.99/month for 65,000. Medium: $39.99 for 650,000 and security data.','Optional alternative/enrichment. Cache per visit or IP within your retention policy; do not buy a lookup for every typing event.','ipbase'],
 ['Interactive map basemap','Mapbox GL JS map-load pricing: first 50,000 loads/month free; next 50,000 at $5/1,000.','Loads are map initializations, not visitor pins. A self-hosted static world outline can avoid a map API bill, with attribution/licensing handled.','maps'],
 ['Push transport & crash reporting','Firebase Cloud Messaging and Crashlytics are listed as no-cost products.','Delivery transport is only one part: you build permissions, token cleanup, deep links, queues and unread state. Apple delivery requires APNs setup.','push'],
 ['iOS distribution','Apple Developer Program: $99/year (or local equivalent).','About $8.25/month amortized, paid annually. No extra membership per app under the same eligible account; devices and engineering are separate.','apple'],
 ['Android distribution','Google Play developer registration: $25 once.','Account verification, applicable testing requirements and review time remain. This is not a monthly charge or a guarantee of approval.','android'],
 ['Mobile builds & updates','Expo: Free plan available; Starter $19/month + additional usage, including $45 of build credit.','Optional hosted build service. Existing local build hardware can avoid this subscription; store fees still apply.','expo'],
 ['AI answers, drafts & translation','Illustrative direct API rates per 1M input/output tokens: GPT-6 Luna short-context standard $0.10/$0.50; Claude Haiku 4.5 $1/$5.','Different models and tokenizers are not quality-equivalent. Long context, caching, reasoning, tools and additional calls can change the bill.','openai','anthropic'],
 ['Knowledge embeddings & retrieval','text-embedding-3-small: $0.02/M tokens. Vectorize Paid: 50M queried dimensions and 10M stored dimensions included; then $0.01/M queried and $0.05/100M stored.','Crawling, parsing and re-indexing cost compute. Choose this pipeline OR a hosted retrieval tool; do not silently count both.','embeddings','vectors'],
 ['Optional hosted file search','OpenAI file search: $0.10/GB-day after 1 GB free, plus $2.50/1,000 tool calls in Responses. Model tokens are separate.','Two GB stored for 30 days means $3 storage beyond the free GB; 10,000 calls add $25. Alternative to your own vector pipeline.','openai'],
 ['Optional model router','OpenRouter Standard lists a 5.5% platform fee; model/provider prices and funding terms apply.','Use direct OpenAI, direct Anthropic OR a router for a given call. Your coding-assistant subscription does not fund the support bot.','openrouter'],
 ['Spam challenges','Turnstile Free: $0 within its plan limits, including up to 20 widgets and 10 hostnames/widget.','Still enforce server-side limits, authorization and file checks. A CAPTCHA is not a security review.','turnstile']
];
// Non-overlapping delivery work packages. Hours include AI-assisted coding,
// integration, review and tests; they are estimates, not measured benchmarks.
export const workPackages = [
 ['Accounts, projects & authorization',32,64,['team-size','extra-members','project-permissions','api-limits'],'Account isolation, invitations, project/feature permissions, session revocation and scoped API keys.','$0 extra license using existing auth; shared API/DB/email meters.'],
 ['Reliable message transport',24,48,['live-chat','live-typing','read-receipts','emoji'],'Durable messages, ordering, retry deduplication, reconnect replay, presence and short-lived typing previews.','Workers + Durable Objects + database; not a second real-time service.'],
 ['Embeddable widget & SDK',32,64,['widget-brand','widget-layouts','seasonal-themes','remove-branding','installation','simple-setup','sdk','lightweight'],'Async loader, iframe, branding, a reusable theme system, SPA lifecycle, accessibility and installation guides.','Shared hosting; $0 separate license for your own UI and SDK.'],
 ['Agent inbox & collaboration',32,64,['shared-inbox','assignment','private-notes','tags','filters','resolved','history-search','saved-replies'],'Unified inbox, per-project filters, private channels, assignment races, searchable history and shortcuts.','Shared database/compute; $0 separate search service if database search is sufficient.'],
 ['Email continuity',20,40,['email-follow-up'],'Templates, reply threading, inbound parsing, delivery webhooks, bounce suppression and retry handling.','Choose Resend $0/$20 or inbound-capable Postmark from $16.50/month.'],
 ['Attachments',12,24,['attachments'],'Authorized upload/download, MIME/size validation, quarantine, image variants and deletion.','R2 + processing. Add a scanner service quote or self-hosted scanning compute.'],
 ['Notifications & scheduled jobs',12,24,['reminders'],'Browser/mobile push, unread counts, mention alerts, deep links, retry queues and follow-up reminders.','FCM transport $0; shared queue/compute. SMS is not assumed.'],
 ['Availability & boundaries',12,24,['online-away','reply-time','night-banner','break-banner','panic-banner','offline-form','business-hours','announcement-banner'],'Time zones, daylight-saving transitions, manual overrides, schedules, offline forms and banner precedence.','Shared database, scheduler and email; $0 separate scheduling subscription.'],
 ['Visitor context & commerce data',24,40,['visitor-list','visitor-profile','browsing-context','custom-data','visitor-cart'],'Signed identity, active page, custom fields, cart snapshots and SDK updates across logins.','Shared event storage; enrichment $0 via edge metadata or optional ipbase.'],
 ['Live visitor map',16,32,['live-map'],'Presence expiry, approximate locations, clusters, project filters and visitor selection.','Mapbox $0 through 50,000 loads; optional ipbase $9.99 for 65,000 lookups.'],
 ['Analytics, satisfaction & reports',20,40,['analytics','satisfaction','team-reports'],'Event definitions, aggregates, survey delivery and response-time reports by teammate/time of day.','Shared event/database meters; BI SaaS is optional, not required.'],
 ['Help center & publishing',32,64,['help-center','help-domain','help-markdown','help-collections','help-widget','help-publishing','help-insights','help-seo','help-branding'],'Editor, collections, drafts, public search, custom-domain validation/TLS, reactions and SEO metadata.','Shared hosting/storage; your own subdomain $0 incremental registration. New domains and large-scale custom-hostname services are extra.'],
 ['Help center localization',16,32,['multilingual-help','help-auto-translation','help-translation-review'],'Language routing, translation jobs, source-version tracking, review and stale-translation markers.','AI tokens + jobs. Human proofreading time is additional ongoing editorial work.'],
 ['Imports & migrations',20,40,['help-import'],'Import adapters for Crisp, GitBook, Intercom, Gleap and Help Scout; preserve links, images and language versions.','Shared job/storage meters. Export/API access depends on the source plan.'],
 ['AI answers & knowledge',36,72,['knowledge','automatic-replies','ai-drafts','ai-per-chat','ai-shortcuts','help-ai'],'Website/file ingestion, retrieval by project, prompt versions, drafts, automatic replies and evaluation cases.','AI tokens + embeddings/vector search + crawler jobs; see the separate AI calculation.'],
 ['Safe AI handoff',24,48,['human-takeover','handoff-triggers','ai-confidence','handoff-assignment','seamless-handoff'],'Escalation rules, uncertainty handling, team notifications, assignment and collision-free human takeover.','Shared jobs/DB + any classification tokens; $0 separate handoff vendor.'],
 ['AI utility features',16,32,['translation','summaries','urgency'],'Two-way chat translation, summaries and urgency ranking, with original text and provenance retained.','Additional model calls: priced by their actual input and output, not included free in an answer.'],
 ['Provider choice & AI identity',16,32,['ai-providers','own-key','usage-pricing','custom-orky'],'Encrypted per-project credentials, provider adapters, usage ledger, budgets and assistant branding.','Provider tokens; router fee only if used. Secret storage uses your chosen platform.'],
 ['iOS & Android operator apps',60,120,['mobile'],'Shared cross-platform inbox plus native push, login, deep links, offline recovery, accessibility and store releases.','$99/year Apple + $25 once Google; Expo $0 or $19/month + usage; hardware separate.'],
 ['Hardening, releases & recovery',32,64,['blocking'],'Abuse controls, backups/restores, retention/deletion, integration tests, monitoring, rollback and operating documentation.','Shared meters + an editorial $0–30/month monitoring/CI allowance at small scale; independent security/legal work requires a quote.']
];
export const totalBuildHours = workPackages.reduce((a,p)=>[a[0]+p[1],a[1]+p[2]],[0,0]);
// Examples deliberately stay under Cloudflare's included usage. Reservations
// are planning allowances, not hidden provider charges or usage benchmarks.
export const scenarios = [
 {name:'Lean web support',visits:'10,000',conversations:500,aiReplies:0,emails:'1,500 · at most 100/day',storage:'2 GB',items:[['Workers Paid',5],['Email · Resend Free',0],['Database, real time, files, queues within allowances',0],['Geolocation + map within allowance',0],['Monitoring / CI planning allowance',0],['Operational headroom reserve',5]],note:'One operator. Browser-first, no native app distribution, no AI. Resend Free only works if daily sending stays inside its cap.'},
 {name:'Small AI support team',visits:'50,000',conversations:2000,aiReplies:10000,emails:'10,000 sent + received',storage:'8 GB',items:[['Workers Paid',5],['Email · Resend Pro',20],['Database, real time, files, queues within allowances',0],['Geolocation + map within allowance',0],['AI · Haiku 4.5 · 50M input + 5M output',75],['Embeddings · 1M tokens',0.02],['Monitoring / CI planning allowance',20],['Operational headroom reserve',10]],note:'Three operators, five AI replies per conversation. Uses edge geolocation, self-managed retrieval and web/PWA access; native releases are not included.'},
 {name:'Growing support + mobile',visits:'250,000',conversations:10000,aiReplies:50000,emails:'40,000 sent + received',storage:'50 GB',items:[['Workers Paid',5],['Email · Resend Pro',20],['Database, real time, queues within allowances',0],['R2 storage · (50 − 10) × $0.015',0.60],['ipbase Medium · optional enrichment selected',39.99],['Mapbox · under 50,000 loads',0],['AI · Haiku 4.5 · 250M input + 25M output',375],['Embeddings · 5M tokens',0.10],['Apple membership · annual cost / 12',8.25],['Expo Starter · within build credit',19],['Monitoring / CI planning allowance',30],['Operational headroom reserve',30]],note:'Twelve operators. Google Play registration adds $25 once, not monthly. Existing test hardware assumed; extra builds, model calls and quota overruns are extra.'}
];
export const scenarioTotal = scenario => Math.round(scenario.items.reduce((sum,[,price])=>sum+price,0)*100)/100;
