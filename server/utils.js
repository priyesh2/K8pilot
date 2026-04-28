// === K8pilot Server Shared Utilities ===
// Extracted to eliminate 3x code duplication across endpoints.

/**
 * Safe nested property accessor — guards against null/undefined in any K8s API version.
 * @param {object} obj - Source object
 * @param {string} keyPath - Dot-separated path (e.g. 'status.phase')
 * @param {*} def - Default value if path is missing
 */
const safeGet = (obj, keyPath, def = '') => {
  return keyPath.split('.').reduce((o, k) => (o && o[k] !== undefined && o[k] !== null) ? o[k] : def, obj);
};

/**
 * Parse K8s CPU quantity string to millicores (integer).
 * Handles: '500m', '1', '2000n', plain numbers.
 */
const parseCpu = (s) => {
  if (!s) return 0;
  if (typeof s === 'number') return s * 1000;
  s = String(s);
  if (s.endsWith('m')) return parseInt(s);
  if (s.endsWith('n')) return parseInt(s) / 1000000;
  return parseFloat(s) * 1000 || 0;
};

/**
 * Parse K8s CPU to float (cores). Use for capacity/utilization math.
 */
const parseCpuCores = (s) => {
  if (!s) return 0;
  s = String(s);
  if (s.endsWith('m')) return parseInt(s) / 1000;
  if (s.endsWith('n')) return parseInt(s) / 1000000000;
  return parseFloat(s) || 0;
};

/**
 * Parse K8s memory quantity string to MiB.
 * Handles: '128Mi', '1Gi', '262144Ki', plain bytes.
 */
const parseMem = (s) => {
  if (!s) return 0;
  if (typeof s === 'number') return s / (1024 * 1024);
  s = String(s);
  if (s.endsWith('Ki')) return parseInt(s) / 1024;
  if (s.endsWith('Mi')) return parseInt(s);
  if (s.endsWith('Gi')) return parseInt(s) * 1024;
  if (s.endsWith('Ti')) return parseInt(s) * 1024 * 1024;
  return parseInt(s) / (1024 * 1024) || 0;
};

/**
 * Format millicores to human-readable CPU string.
 */
const fmtCpu = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)}` : `${Math.round(m)}m`;

/**
 * Format MiB to human-readable memory string.
 */
const fmtMem = (mi) => mi >= 1024 ? `${(mi / 1024).toFixed(1)}Gi` : `${Math.round(mi)}Mi`;

/**
 * Compute a human-readable age string from a K8s ISO timestamp.
 */
const formatAge = (timestamp) => {
  if (!timestamp) return 'N/A';
  try {
    const ms = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  } catch { return 'N/A'; }
};

module.exports = { safeGet, parseCpu, parseCpuCores, parseMem, fmtCpu, fmtMem, formatAge };
