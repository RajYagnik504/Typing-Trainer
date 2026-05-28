const TRIAL_KEY = 'tc_trial_start';
const PAID_KEY = 'tc_paid_user';
const OWNER_KEY = 'tc_owner_unlocked';
const TRIAL_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export function isOwnerUnlocked() {
  try {
    return localStorage.getItem(OWNER_KEY) === 'true';
  } catch(e) { return false; }
}

export function isPaidUser() {
  try {
    return localStorage.getItem(PAID_KEY) === 'true';
  } catch(e) { return false; }
}

export function isFullAccess() {
  return isOwnerUnlocked() || isPaidUser();
}

export function getTrialStartTime() {
  try {
    const t = localStorage.getItem(TRIAL_KEY);
    return t ? parseInt(t) : null;
  } catch(e) { return null; }
}

export function startTrialIfNotStarted() {
  try {
    if (!localStorage.getItem(TRIAL_KEY)) {
      localStorage.setItem(TRIAL_KEY, Date.now().toString());
    }
  } catch(e) {}
}

export function getTrialTimeLeftMs() {
  const start = getTrialStartTime();
  if (!start) return TRIAL_DURATION;
  const elapsed = Date.now() - start;
  return Math.max(0, TRIAL_DURATION - elapsed);
}

export function isTrialExpired() {
  if (isFullAccess()) return false;
  const start = getTrialStartTime();
  if (!start) return false;
  return Date.now() - start >= TRIAL_DURATION;
}

export function unlockOwner() {
  try {
    localStorage.setItem(OWNER_KEY, 'true');
  } catch(e) {}
}

export function unlockPaid() {
  try {
    localStorage.setItem(PAID_KEY, 'true');
  } catch(e) {}
}

export function formatTimeLeft(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
