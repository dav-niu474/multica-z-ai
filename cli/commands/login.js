const readline = require('node:readline');
const { post, colors } = require('../lib/api');
const { getConfig, saveConfig } = require('../lib/config');

function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stderr, // Use stderr so it doesn't interfere with stdout piping
  });
}

/**
 * Prompt user for input.
 * @param {readline.Interface} rl
 * @param {string} prompt
 * @returns {Promise<string>}
 */
function prompt(rl, text) {
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Run the login command.
 */
async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const rl = createReadline();

  try {
    // Check if already logged in
    const config = getConfig();
    if (config.token) {
      console.log(colors.yellow('⚠ You are already logged in.'));
      console.log(colors.dim(`  Server: ${config.serverUrl}`));
      console.log(colors.dim('  Run "multica login" again to re-authenticate.'));
      process.exit(0);
    }

    console.log(colors.cyan('  AgentHub CLI Login'));
    console.log('');

    const email = await prompt(rl, colors.bold('Email: '));
    if (!email) {
      console.error(colors.red('✗ Email is required.'));
      process.exit(1);
    }

    const password = await prompt(rl, colors.bold('Password: '));
    if (!password) {
      console.error(colors.red('✗ Password is required.'));
      process.exit(1);
    }

    console.log('');
    process.stderr.write(colors.dim('  Authenticating...\n'));

    const result = await post('/api/signin', {
      body: { email, password },
      skipAuth: true,
    });

    if (!result.ok) {
      console.error(colors.red(`✗ Login failed: ${result.data?.error || 'Unknown error'}`));
      process.exit(1);
    }

    const { token, user } = result.data;

    // Save config
    saveConfig({
      ...config,
      token,
    });

    console.log('');
    console.log(colors.green(`✓ Logged in as ${user.name || user.email}`));
    console.log(colors.dim(`  Server: ${config.serverUrl}`));
    console.log(colors.dim(`  Config: ~/.multica/config.json`));
  } catch (err) {
    console.error(colors.red(`✗ Connection error: ${err.message}`));
    process.exit(1);
  } finally {
    rl.close();
  }
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica login

${colors.bold('Description:')}
  Authenticate with an AgentHub server. Stores a JWT token in
  ~/.multica/config.json for subsequent commands.

${colors.bold('Options:')}
  -h, --help    Show this help message

${colors.bold('Environment:')}
  The server URL can be configured with:
    multica config set serverUrl <url>

  Default: http://localhost:3000

${colors.bold('Examples:')}
  $ multica login
  Email: alex@agenthub.dev
  Password: ****
  ✓ Logged in as Alex Chen
`);
}

module.exports = { run, printHelp };
