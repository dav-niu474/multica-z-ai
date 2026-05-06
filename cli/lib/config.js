const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CONFIG_DIR = path.join(os.homedir(), '.multica');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  serverUrl: 'http://localhost:3000',
  token: null,
};

/**
 * Ensure the config directory exists.
 */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load config from ~/.multica/config.json.
 * Returns merged config with defaults.
 */
function getConfig() {
  ensureConfigDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...data };
    }
  } catch (err) {
    // Corrupted config file - warn and return defaults
    console.error(`Warning: Could not read config file: ${err.message}`);
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * Save config to ~/.multica/config.json.
 * @param {Record<string, any>} config
 */
function saveConfig(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

/**
 * Get the auth token from config.
 * @returns {string|null}
 */
function getAuthToken() {
  const config = getConfig();
  return config.token || null;
}

/**
 * Check if the user is logged in.
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!getAuthToken();
}

module.exports = {
  getConfig,
  saveConfig,
  getAuthToken,
  isLoggedIn,
  CONFIG_DIR,
  CONFIG_FILE,
  DEFAULT_CONFIG,
};
