const { get, post, handleError, colors } = require('../lib/api');
const { printTable } = require('../lib/table');

const STATUS_LABELS = {
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  archived: 'Archived',
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
 * Run the project command.
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
      await listProjects(jsonMode);
      break;
    case 'get':
      await getProject(positional[0], jsonMode);
      break;
    case 'create':
      await createProject(flags, jsonMode);
      break;
    default:
      console.error(colors.red(`✗ Unknown project command: "${subcommand}"`));
      console.error(colors.dim('  Run "multica project --help" for usage.'));
      process.exit(1);
  }
}

async function listProjects(jsonMode) {
  const result = await get('/api/projects');

  if (!result.ok) {
    handleError('listing projects', result, jsonMode);
  }

  const projects = Array.isArray(result.data) ? result.data : [];

  if (jsonMode) {
    console.log(JSON.stringify(projects, null, 2));
    return;
  }

  if (projects.length === 0) {
    console.log(colors.dim('No projects found.'));
    return;
  }

  const headers = ['Title', 'Status', 'Progress', 'Issues', 'Lead'];
  const rows = projects.map(project => {
    const progress = project.progress !== undefined
      ? `${project.progress}%`
      : '-';
    return [
      project.title || '-',
      STATUS_LABELS[project.status] || project.status || '-',
      progress,
      `${project.doneCount || 0}/${project.totalIssues || 0}`,
      project.leadType || '-',
    ];
  });

  printTable(headers, rows);
}

async function getProject(id, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Project ID is required.'));
    console.error(colors.dim('  Usage: multica project get <id>'));
    process.exit(1);
  }

  const result = await get(`/api/projects/${id}`);

  if (!result.ok) {
    handleError(`fetching project ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const project = result.data;
  console.log('');
  console.log(`${colors.bold('Title:')}       ${project.title}`);
  console.log(`${colors.bold('ID:')}         ${project.id}`);
  console.log(`${colors.bold('Status:')}     ${STATUS_LABELS[project.status] || project.status || '-'}`);
  if (project.description) {
    console.log(`${colors.bold('Description:')} ${project.description}`);
  }
  console.log(`${colors.bold('Progress:')}   ${project.progress !== undefined ? `${project.progress}%` : '-'} (${project.doneCount || 0}/${project.totalIssues || 0} issues)`);
  console.log(`${colors.bold('Created:')}    ${project.createdAt ? new Date(project.createdAt).toLocaleString() : '-'}`);
  console.log('');
}

async function createProject(flags, jsonMode) {
  if (!flags.title) {
    console.error(colors.red('✗ --title is required for creating a project.'));
    console.error(colors.dim('  Usage: multica project create --title "..."'));
    process.exit(1);
  }

  const body = {
    title: flags.title,
    description: flags.description || null,
    priority: flags.priority || 'none',
    status: flags.status || 'active',
  };

  const result = await post('/api/projects', { body });

  if (!result.ok) {
    handleError('creating project', result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const project = result.data;
  console.log('');
  console.log(colors.green(`✓ Project created successfully`));
  console.log(`  ${colors.bold('Title:')}   ${project.title}`);
  console.log(`  ${colors.bold('Status:')}  ${STATUS_LABELS[project.status] || project.status}`);
  console.log('');
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica project <command> [options]

${colors.bold('Commands:')}
  list              List all projects
  get <id>          Get project details
  create            Create a new project

${colors.bold('Create Options:')}
  --title <title>     Project title (required)
  --description <d>   Project description
  --priority <p>      Priority: none, low, medium, high, urgent
  --status <s>        Status: active, on_hold, completed (default: active)

${colors.bold('Global Options:')}
  --json            Output in JSON format
  -h, --help        Show this help message

${colors.bold('Examples:')}
  $ multica project list
  $ multica project get <project-id>
  $ multica project create --title "Frontend Redesign"
  $ multica project list --json
`);
}

module.exports = { run, printHelp };
