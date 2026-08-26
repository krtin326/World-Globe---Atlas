/* auth.js — a client-side login gate.
 *
 * IMPORTANT — this is NOT real security.
 * ---------------------------------------------------------------------------
 * A static website has no server, so any check that runs here runs in the
 * visitor's own browser. To keep the raw passwords out of the page source we
 * store only SHA-256 hashes of "salt + username : password" and verify with
 * the browser's built-in Web Crypto API. That stops someone reading a password
 * straight out of the source, but a determined person can still bypass a
 * client-side gate entirely. Do not put anything genuinely sensitive behind it.
 *
 * The human-readable list of accounts lives in docs/atlas_logins.xlsx (created
 * alongside this project, as requested). Keep that file private.
 * ---------------------------------------------------------------------------
 */

const SALT = 'atlas::v1::';

// username -> { hash, role }.  hash = SHA-256(SALT + username + ':' + password)
const USERS = {
  admin:   { hash: '265ccbb5b9c091870885af4ea66766e119e4670f8586c1c9f65f78c284067b72', role: 'Site owner / administrator' },
  krtin:   { hash: 'e95b17166880633a9dfff6c1c2192bc485bbbed4af7be9fb98f3f5bf3353dc7b', role: 'Owner account' },
  teacher: { hash: 'a55cde3adea66d392c3ad8ba8e49c8e9580d9ff2a70e777a5146e795fb6cb446', role: 'Classroom / demo account' },
  guest:   { hash: '6bd68ded61cf53672e5bba7a24db84856e52beb10559dc0a1df9da925b96cb67', role: 'Read-only guest' },
};

const SESSION_KEY = 'atlas.session';
const LOCAL_USERS_KEY = 'atlas.users';   // self-registered accounts (this browser only)

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* --- Self-registered accounts -----------------------------------------
 * Sign-up on a server-less site can only store the new account in the
 * visitor's own browser (localStorage). These accounts therefore live on
 * ONE device/browser and are not shared with anyone else — and, like the
 * built-in accounts, they are protected only by a client-side gate, not by
 * real security. We still store only the SHA-256 hash, never the password. */
function getLocalUsers() {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}'); }
  catch { return {}; }
}
function saveLocalUsers(users) {
  try { localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users)); } catch { /* ignore */ }
}

/**
 * Register a new account in this browser. Resolves to a user object, or
 * throws an Error with a human-readable message if the input is invalid or
 * the username is taken.
 */
export async function register(username, password) {
  const u = String(username || '').trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,20}$/.test(u)) {
    throw new Error('Username must be 3–20 characters: letters, numbers, and . _ - only.');
  }
  if (USERS[u] || getLocalUsers()[u]) {
    throw new Error('That username is already taken. Try another.');
  }
  if (String(password || '').length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  const hash = await sha256Hex(SALT + u + ':' + password);
  const users = getLocalUsers();
  users[u] = { hash, role: 'Member (self-registered)' };
  saveLocalUsers(users);
  return { username: u, role: users[u].role };
}

/** Verify a username/password pair. Resolves to a user object or null. */
export async function verify(username, password) {
  const u = String(username || '').trim().toLowerCase();
  const record = USERS[u] || getLocalUsers()[u];
  if (!record) {
    // Hash anyway to keep timing roughly constant for unknown users.
    await sha256Hex(SALT + u + ':' + password);
    return null;
  }
  const hash = await sha256Hex(SALT + u + ':' + String(password || ''));
  if (hash === record.hash) return { username: u, role: record.role };
  return null;
}

/** Persist a logged-in session for this tab. */
export function setSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, at: Date.now() }));
  } catch { /* storage may be unavailable; app still works for this view */ }
}

/** Return the current session user, or null. */
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
