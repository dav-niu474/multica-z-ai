const { get, handleError, colors } = require('../lib/api');
const { printTable } = require('../lib/table');

/**
 * Run the workspace command.
 * @param {string} subcommand - 'list' or 'get'
 * @param {string[]} args
 */
async function run(subcommand, args) {
  if (!subcommand || subcommand === '--help' || subcommand === '-h') {
    printHelp();
    process.exit(0);
  }

  const jsonMode = args.includes('--json');
  const cleanArgs = args.filter(a => !a.startsWith('--'));

  switch (subcommand) {
    case 'list':
      await listWorkspaces(jsonMode);
      break;
    case 'get':
      await getWorkspace(cleanArgs[0], jsonMode);
      break;
    default:
      console.error(colors.red(`✗ Unknown workspace command: "${subcommand}"`));
      console.error(colors.dim('  Run "multica workspace --help" for usage.'));
      process.exit(1);
  }
}

async function listWorkspaces(jsonMode) {
  const result = await get('/api/workspaces');

  if (!result.ok) {
    handleError('listing workspaces', result, jsonMode);
  }

  const workspaces = Array.isArray(result.data) ? result.data : [];

  if (jsonMode) {
    console.log(JSON.stringify(workspaces, null, 2));
    return;
  }

  if (workspaces.length === 0) {
    console.log(colors.dim('No workspaces found.'));
    return;
  }

  const headers = ['Name', 'Slug', 'Members', 'Agents', 'Issues', 'Projects'];
  const rows = workspaces.map(ws => [
    ws.name || '-',
    ws.slug || '-',
    String(ws._count?.members || 0),
    String(ws._count?.agents || 0),
    String(ws._count?.issues || 0),
    String(ws._count?.projects || 0),
  ]);

  printTable(headers, rows);
}

async function getWorkspace(id, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Workspace ID is required.'));
    console.error(colors.dim('  Usage: multica workspace get <id>'));
    process.exit(1);
  }

  const result = await get(`/api/workspaces/${id}`);

  if (!result.ok) {
    handleError(`fetching workspace ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const ws = result.data;
  console.log('');
  console.log(`${colors.bold('Name:')}       ${ws.name}`);
  console.log(`${colors.bold('Slug:')}       ${ws.slug}`);
  console.log(`${colors.bold('ID:')}         ${ws.id}`);
  if (ws.description) {
    console.log(`${colors.bold('Description:')} ${ws.description}`);
  }
  if (ws.context) {
    console.log(`${colors.bold('Context:')}    ${ws.context}`);
  }
  console.log(`${colors.bold('Issue Prefix:')} ${ws.issuePrefix || '-'}`);
  console.log(`${colors.bold('Members:')}    ${ws._count?.members || 0}`);
  console.log(`${colors.bold('Agents:')}     ${ws._count?.agents || 0}`);
  console.log(`${colors.bold('Issues:')}     ${ws._count?.issues || 0}`);
  console.log(`${colors.bold('Projects:')}   ${ws._count?.projects || 0}`);
  console.log(`${colors.bold('Created:')}    ${ws.createdAt ? new Date(ws.createdAt).toLocaleString() : '-'}`);
  console.log('');
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica workspace <command> [options]

${colors.bold('Commands:')}
  list              List all workspaces
  get <id>          Get workspace details

${colors.bold('Options:')}
  --json            Output in JSON format
  -h, --help        Show this help message

${colors.bold('Examples:')}
  $ multica workspace list
  $ multica workspace get <workspace-id>
  $ multica workspace list --json
`);
}

module.exports = { run, printHelp };
