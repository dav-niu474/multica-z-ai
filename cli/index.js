#!/usr/bin/env node

/**
 * Multica CLI - Command-line interface for the AgentHub/Multica platform.
 *
 * Usage:
 *   multica <command> [subcommand] [options]
 *
 * Commands:
 *   login              Authenticate with the server
 *   workspace          Manage workspaces (list, get)
 *   issue              Manage issues (list, get, create, update)
 *   agent              Manage agents (list, get, create)
 *   project            Manage projects (list, get, create)
 *   skill              Manage skills (list, get)
 *   config             Manage CLI configuration
 *   version            Show CLI version
 */

const { colors } = require('./lib/api');
const { getConfig, saveConfig } = require('./lib/config');

const VERSION = '1.0.0';
const COMMANDS = ['login', 'workspace', 'issue', 'agent', 'project', 'skill', 'config', 'version'];

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  process.exit(0);
});

/**
 * Print the main help message.
 */
function printMainHelp() {
  console.log(`
${colors.bold('multica')} ${colors.dim(`v${VERSION}`)}

${colors.bold('AgentHub / Multica CLI')} — Manage your multi-agent collaboration platform from the terminal.

${colors.bold('Usage:')}
  multica <command> [subcommand] [options]

${colors.bold('Commands:')}
  login              ${colors.dim('Authenticate with the server')}
  workspace          ${colors.dim('Manage workspaces (list, get)')}
  issue              ${colors.dim('Manage issues (list, get, create, update)')}
  agent              ${colors.dim('Manage agents (list, get, create)')}
  project            ${colors.dim('Manage projects (list, get, create)')}
  skill              ${colors.dim('Manage skills (list, get)')}
  config             ${colors.dim('Manage CLI configuration')}
  version            ${colors.dim('Show CLI version')}

${colors.bold('Global Options:')}
  -h, --help         Show help for a command
  --json             Output in JSON format (list/get commands)

${colors.bold('Quick Start:')}
  ${colors.cyan('$ multica login')}
  ${colors.cyan('$ multica workspace list')}
  ${colors.cyan('$ multica issue list --status in_progress')}
  ${colors.cyan('$ multica issue create --title "Fix bug" --priority high')}

${colors.bold('Configuration:')}
  Config stored at: ${colors.dim('~/.multica/config.json')}
  ${colors.dim('Contains: serverUrl, token')}
`);
}

/**
 * Run the config command.
 * @param {string[]} args
 */
async function runConfig(args) {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printConfigHelp();
    return;
  }

  const sub = args[0];

  switch (sub) {
    case 'show':
    case 'get': {
      const config = getConfig();
      const display = { ...config };
      if (display.token) {
        display.token = display.token.slice(0, 12) + '...' + display.token.slice(-4);
      }
      console.log(JSON.stringify(display, null, 2));
      break;
    }
    case 'set': {
      const key = args[1];
      const value = args[2];
      if (!key || !value) {
        console.error(colors.red('✗ Usage: multica config set <key> <value>'));
        process.exit(1);
      }
      const config = getConfig();
      if (key === 'token' || key === 'serverUrl') {
        config[key] = value;
        saveConfig(config);
        console.log(colors.green(`✓ Set ${key} successfully.`));
      } else {
        console.error(colors.red(`✗ Unknown config key: "${key}"`));
        console.error(colors.dim('  Available keys: serverUrl, token'));
        process.exit(1);
      }
      break;
    }
    case 'clear': {
      const config = getConfig();
      config.token = null;
      saveConfig(config);
      console.log(colors.green('✓ Cleared authentication token.'));
      console.log(colors.dim('  Run "multica login" to authenticate again.'));
      break;
    }
    default:
      console.error(colors.red(`✗ Unknown config command: "${sub}"`));
      console.error(colors.dim('  Run "multica config --help" for usage.'));
      process.exit(1);
  }
}

function printConfigHelp() {
  console.log(`
${colors.bold('Usage:')} multica config <command> [options]

${colors.bold('Commands:')}
  show              Show current configuration (token is masked)
  get               Alias for 'show'
  set <key> <value> Set a configuration value
  clear             Clear the authentication token

${colors.bold('Available Keys:')}
  serverUrl         Server URL (default: http://localhost:3000)
  token             JWT authentication token

${colors.bold('Examples:')}
  $ multica config show
  $ multica config set serverUrl https://my-agenthub.com
  $ multica config clear
`);
}

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2);

  // No arguments or help flag
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printMainHelp();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'version':
    case '--version':
    case '-v':
      console.log(`multica v${VERSION}`);
      break;

    case 'login': {
      const login = require('./commands/login');
      await login.run(commandArgs);
      break;
    }

    case 'workspace': {
      const workspace = require('./commands/workspace');
      await workspace.run(commandArgs[0], commandArgs.slice(1));
      break;
    }

    case 'issue': {
      const issue = require('./commands/issue');
      await issue.run(commandArgs[0], commandArgs.slice(1));
      break;
    }

    case 'agent': {
      const agent = require('./commands/agent');
      await agent.run(commandArgs[0], commandArgs.slice(1));
      break;
    }

    case 'project': {
      const project = require('./commands/project');
      await project.run(commandArgs[0], commandArgs.slice(1));
      break;
    }

    case 'skill': {
      const skill = require('./commands/skill');
      await skill.run(commandArgs[0], commandArgs.slice(1));
      break;
    }

    case 'config': {
      await runConfig(commandArgs);
      break;
    }

    default:
      console.error(colors.red(`✗ Unknown command: "${command}"`));
      console.error(colors.dim(`  Available commands: ${COMMANDS.join(', ')}`));
      console.error(colors.dim('  Run "multica --help" for usage.'));
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(colors.red(`✗ Unexpected error: ${err.message}`));
  process.exit(1);
});
