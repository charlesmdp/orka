// Read-only connection check. It does not create users, query tables or change data.
const expectedOrigin = 'https://ppglbozceswzrykhwbpq.supabase.co';
const url = process.env.SUPABASE_URL || expectedOrigin;
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();

try {
  if (new URL(url).href !== expectedOrigin + '/') {
    throw new Error('SUPABASE_URL must point to the Orka project: ' + expectedOrigin);
  }
  if (!key) throw new Error('Set SUPABASE_PUBLISHABLE_KEY in .dev.vars before checking the connection.');
  let publicKey = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if (!publicKey && key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
      publicKey = payload.role === 'anon' && payload.ref === 'ppglbozceswzrykhwbpq';
    } catch { /* Reject malformed or privileged keys. */ }
  }
  if (!publicKey) throw new Error('Use this project’s publishable key (or legacy anon key), never a secret/service_role key.');
  const response = await fetch(expectedOrigin + '/auth/v1/settings', {
    headers: {apikey:key},
    signal: AbortSignal.timeout(15000),
    redirect: 'error'
  });
  if (!response.ok) throw new Error('Supabase connection failed (HTTP ' + response.status + '). Check the key and project status.');
  const settings = await response.json();
  if (!settings || typeof settings !== 'object' || !('external' in settings)) {
    throw new Error('Supabase returned an unexpected response.');
  }
  console.log('Connected to Orka’s Supabase Auth API. No data changed. Database access policies were not tested.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
