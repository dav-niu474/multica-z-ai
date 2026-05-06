const { get, post, handleError, colors } = require('../lib/api');
const { printTable } = require('../lib/table');

const PROVIDER_LABELS = {
  claude: 'Claude',
  codex: 'Codex',
  openai: 'OpenAI',
  gemini: 'Gemini',
  custom: 'Custom',
  nvidia: 'NVIDIA',
  glm: 'GLM',
  volcano: 'Volcano',
  anthropic: 'Anthropic',
};

const STATUS_LABELS = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
  error: 'Error',
  offline: 'Offline',
};

/**
 * Parse CLI arguments for named flags with values.
 * @param {string[]} args
 * @returns {{ positional: string[], flags: Record<string, string|boolean> }}
 */
function parseArgs(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(args[i]);
    }
  }
  return { positional, flags };
}

/**
 * Run the agent command.
 * @param {string} subcommand
 * @param {string[]} args
 */
async function run(subcommand, args) {
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    printHelp();
    process.exit(0);
  }

  const { positional, flags } = parseArgs(args);
  const jsonMode = flags.json || false;
  delete flags.json;

  switch (subcommand) {
    case 'list':
      await listAgents(jsonMode);
      break;
    case 'get':
      await getAgent(positional[0], jsonMode);
      break;
    case 'create':
      await createAgent(flags, jsonMode);
      break;
    default:
      console.error(colors.red(`✗ Unknown agent command: "${subcommand}"`));
      console.error(colors.dim('  Run "multica agent --help" for usage.'));
      process.exit(1);
  }
}

async function listAgents(jsonMode) {
  const result = await get('/api/agents');

  if (!result.ok) {
    handleError('listing agents', result, jsonMode);
  }

  const agents = Array.isArray(result.data) ? result.data : [];

  if (jsonMode) {
    console.log(JSON.stringify(agents, null, 2));
    return;
  }

  if (agents.length === 0) {
    console.log(colors.dim('No agents found.'));
    return;
  }

  const headers = ['Name', 'Provider', 'Status', 'Visibility', 'Tasks', 'Skills'];
  const rows = agents.map(agent => [
    agent.name || '-',
    PROVIDER_LABELS[agent.provider] || agent.provider || '-',
    STATUS_LABELS[agent.status] || agent.status || '-',
    agent.visibility || '-',
    String(agent._count?.tasks || 0),
    String(agent.skills?.length || 0),
  ]);

  printTable(headers, rows);
}

async function getAgent(id, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Agent ID is required.'));
    console.error(colors.dim('  Usage: multica agent get <id>'));
    process.exit(1);
  }

  const result = await get(`/api/agents/${id}`);

  if (!result.ok) {
    handleError(`fetching agent ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const agent = result.data;
  console.log('');
  console.log(`${colors.bold('Name:')}         ${agent.name}`);
  console.log(`${colors.bold('ID:')}           ${agent.id}`);
  console.log(`${colors.bold('Provider:')}     ${PROVIDER_LABELS[agent.provider] || agent.provider || '-'}`);
  console.log(`${colors.bold('Status:')}       ${STATUS_LABELS[agent.status] || agent.status || '-'}`);
  console.log(`${colors.bold('Visibility:')}   ${agent.visibility || '-'}`);
  if (agent.description) {
    console.log(`${colors.bold('Description:')}  ${agent.description}`);
  }
  if (agent.instructions) {
    console.log(`${colors.bold('Instructions:')}`);
    console.log(`  ${agent.instructions.split('\n').join('\n  ')}`);
  }
  if (agent.model) {
    console.log(`${colors.bold('Model:')}        ${agent.model}`);
  }
  console.log(`${colors.bold('Max Tasks:')}    ${agent.maxConcurrentTasks || '-'}`);
  console.log(`${colors.bold('Total Tasks:')}  ${agent._count?.tasks || 0}`);
  console.log(`${colors.bold('Skills:')}       ${agent.skills?.length || 0}`);
  if (agent.skills && agent.skills.length > 0) {
    agent.skills.forEach(s => {
      console.log(`    - ${s.skill?.name || s.skillId}`);
    });
  }
  console.log(`${colors.bold('Created:')}      ${agent.createdAt ? new Date(agent.createdAt).toLocaleString() : '-'}`);
  console.log('');
}

async function createAgent(flags, jsonMode) {
  if (!flags.name) {
    console.error(colors.red('✗ --name is required for creating an agent.'));
    console.error(colors.dim('  Usage: multica agent create --name "..." --provider claude [--instructions "..."]'));
    process.exit(1);
  }

  const body = {
    name: flags.name,
    description: flags.description || null,
    provider: flags.provider || 'claude',
    instructions: flags.instructions || null,
    visibility: flags.visibility || 'workspace',
    maxConcurrentTasks: flags.maxConcurrentTasks ? parseInt(flags.maxConcurrentTasks, 10) : 3,
  };

  const result = await post('/api/agents', { body });

  if (!result.ok) {
    handleError('creating agent', result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const agent = result.data;
  console.log('');
  console.log(colors.green(`✓ Agent created successfully`));
  console.log(`  ${colors.bold('Name:')}     ${agent.name}`);
  console.log(`  ${colors.bold('Provider:')} ${PROVIDER_LABELS[agent.provider] || agent.provider}`);
  console.log(`  ${colors.bold('Status:')}   ${STATUS_LABELS[agent.status] || agent.status}`);
  console.log('');
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica agent <command> [options]

${colors.bold('Commands:')}
  list              List all agents
  get <id>          Get agent details
  create            Create a new agent

${colors.bold('Create Options:')}
  --name <name>         Agent name (required)
  --provider <p>        Provider: claude, openai, gemini, codex, nvidia, glm, volcano, anthropic, custom
  --description <d>     Agent description
  --instructions <i>    Agent system instructions
  --visibility <v>      Visibility: workspace, private (default: workspace)
  --maxConcurrentTasks <n> Max concurrent tasks (default: 3)

${colors.bold('Global Options:')}
  --json            Output in JSON format
  -h, --help        Show this help message

${colors.bold('Examples:')}
  $ multica agent list
  $ multica agent get <agent-id>
  $ multica agent create --name "Code Reviewer" --provider claude --instructions "Review code for bugs"
  $ multica agent list --json
`);
}

module.exports = { run, printHelp };
