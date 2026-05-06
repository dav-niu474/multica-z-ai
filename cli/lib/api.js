const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');
const { getAuthToken, getConfig } = require('./config');

// ANSI color codes
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

/**
 * Perform an HTTP request and return parsed JSON.
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g., '/api/workspaces')
 * @param {object} options
 * @param {Record<string, string>} [options.query] - Query parameters
 * @param {object} [options.body] - Request body (will be JSON-stringified)
 * @param {boolean} [options.skipAuth] - Skip adding auth header
 * @returns {Promise<{ok: boolean, status: number, data: any}>}
 */
async function request(method, path, options = {}) {
  const { query = {}, body = null, skipAuth = false } = options;
  const config = getConfig();
  const baseUrl = config.serverUrl || 'http://localhost:3000';

  // Build URL with query parameters
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const urlStr = url.toString();
  const parsedUrl = new URL(urlStr);
  const isHttps = parsedUrl.protocol === 'https:';
  const transport = isHttps ? https : http;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add auth header if not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (!token) {
      return {
        ok: false,
        status: 401,
        data: { error: 'Not authenticated. Run "multica login" first.' },
      };
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const bodyStr = body ? JSON.stringify(body) : null;
  if (bodyStr) {
    headers['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers,
    };

    const req = transport.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: parsed,
          });
        } catch (err) {
          resolve({
            ok: false,
            status: res.statusCode,
            data: { error: `Invalid JSON response: ${data.slice(0, 200)}` },
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Connection failed: ${err.message}`));
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

/**
 * GET request.
 */
function get(path, options = {}) {
  return request('GET', path, options);
}

/**
 * POST request.
 */
function post(path, options = {}) {
  return request('POST', path, options);
}

/**
 * PATCH request.
 */
function patch(path, options = {}) {
  return request('PATCH', path, options);
}

/**
 * PUT request.
 */
function put(path, options = {}) {
  return request('PUT', path, options);
}

/**
 * DELETE request.
 */
function del(path, options = {}) {
  return request('DELETE', path, options);
}

/**
 * Handle API errors - print colored error and exit.
 * @param {string} context - What operation was being performed
 * @param {{ok: boolean, status: number, data: any}} result
 * @param {boolean} [jsonMode] - If true, output raw JSON error
 */
function handleError(context, result, jsonMode = false) {
  const { status, data } = result;
  const message = data?.error || data?.details || 'Unknown error';

  if (jsonMode) {
    console.error(JSON.stringify({ error: message, status }, null, 2));
  } else {
    console.error(`${colors.red('✗ Error')} ${context}: ${colors.red(message)}`);
    if (data?.details && data.details !== message) {
      console.error(colors.dim(`  Details: ${data.details}`));
    }
  }
  process.exit(1);
}

module.exports = {
  request,
  get,
  post,
  patch,
  put,
  del,
  handleError,
  colors,
};
