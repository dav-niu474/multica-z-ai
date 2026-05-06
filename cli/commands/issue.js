const { get, post, patch, handleError, colors } = require('../lib/api');
const { printTable } = require('../lib/table');

const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
};

const PRIORITY_LABELS = {
  none: 'None',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

const ASSIGNEE_TYPE_LABELS = {
  member: 'Member',
  agent: 'Agent',
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
      // Check if next arg is a value (not another flag)
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
 * Run the issue command.
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
      await listIssues(flags, jsonMode);
      break;
    case 'get':
      await getIssue(positional[0], jsonMode);
      break;
    case 'create':
      await createIssue(flags, jsonMode);
      break;
    case 'update':
      await updateIssue(positional[0], flags, jsonMode);
      break;
    default:
      console.error(colors.red(`✗ Unknown issue command: "${subcommand}"`));
      console.error(colors.dim('  Run "multica issue --help" for usage.'));
      process.exit(1);
  }
}

async function listIssues(flags, jsonMode) {
  const query = {};
  if (flags.status) query.status = flags.status;
  if (flags.priority) query.priority = flags.priority;
  if (flags.assigneeType) query.assigneeType = flags.assigneeType;
  if (flags.projectId) query.projectId = flags.projectId;
  if (flags.search) query.search = flags.search;
  if (flags.limit) query.limit = flags.limit;

  const result = await get('/api/issues', { query });

  if (!result.ok) {
    handleError('listing issues', result, jsonMode);
  }

  const issues = result.data?.issues || result.data || [];
  const total = result.data?.total || issues.length;

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  if (issues.length === 0) {
    console.log(colors.dim('No issues found.'));
    return;
  }

  const headers = ['Identifier', 'Title', 'Status', 'Priority', 'Assignee', 'Project'];
  const rows = issues.map(issue => [
    issue.identifier || issue.id.slice(0, 8),
    issue.title || '-',
    STATUS_LABELS[issue.status] || issue.status || '-',
    PRIORITY_LABELS[issue.priority] || issue.priority || '-',
    issue.assigneeType
      ? `${ASSIGNEE_TYPE_LABELS[issue.assigneeType] || issue.assigneeType}${issue.assigneeName ? ': ' + issue.assigneeName : ''}`
      : '-',
    issue.project?.title || '-',
  ]);

  printTable(headers, rows);

  // Show pagination info
  if (total > issues.length) {
    console.log(colors.dim(`  Showing ${issues.length} of ${total} issues`));
  }
}

async function getIssue(id, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Issue ID is required.'));
    console.error(colors.dim('  Usage: multica issue get <id>'));
    process.exit(1);
  }

  const result = await get(`/api/issues/${id}`);

  if (!result.ok) {
    handleError(`fetching issue ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const issue = result.data;
  console.log('');
  console.log(`${colors.bold(issue.identifier || issue.id)}`);
  console.log(`${colors.bold('Title:')}       ${issue.title}`);
  console.log(`${colors.bold('Status:')}      ${STATUS_LABELS[issue.status] || issue.status || '-'}`);
  console.log(`${colors.bold('Priority:')}    ${PRIORITY_LABELS[issue.priority] || issue.priority || '-'}`);
  if (issue.description) {
    console.log(`${colors.bold('Description:')}`);
    console.log(`  ${issue.description.split('\n').join('\n  ')}`);
  }
  console.log(`${colors.bold('Assignee:')}    ${issue.assigneeType ? (ASSIGNEE_TYPE_LABELS[issue.assigneeType] || issue.assigneeType) : '-'}`);
  console.log(`${colors.bold('Project:')}     ${issue.project?.title || '-'}`);
  console.log(`${colors.bold('Workspace:')}   ${issue.workspaceId || '-'}`);
  console.log(`${colors.bold('Created:')}     ${issue.createdAt ? new Date(issue.createdAt).toLocaleString() : '-'}`);
  console.log(`${colors.bold('Updated:')}     ${issue.updatedAt ? new Date(issue.updatedAt).toLocaleString() : '-'}`);
  console.log('');
}

async function createIssue(flags, jsonMode) {
  if (!flags.title) {
    console.error(colors.red('✗ --title is required for creating an issue.'));
    console.error(colors.dim('  Usage: multica issue create --title "..." [--description "..."] [--priority high]'));
    process.exit(1);
  }

  const body = {
    title: flags.title,
    description: flags.description || null,
    priority: flags.priority || 'none',
    status: flags.status || 'backlog',
    assigneeType: flags.assigneeType || null,
    assigneeId: flags.assigneeId || null,
    projectId: flags.projectId || null,
  };

  const result = await post('/api/issues', { body });

  if (!result.ok) {
    handleError('creating issue', result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const issue = result.data;
  console.log('');
  console.log(colors.green(`✓ Issue created successfully`));
  console.log(`  ${colors.bold('Identifier:')} ${issue.identifier || issue.id}`);
  console.log(`  ${colors.bold('Title:')}      ${issue.title}`);
  console.log(`  ${colors.bold('Status:')}     ${STATUS_LABELS[issue.status] || issue.status}`);
  console.log(`  ${colors.bold('Priority:')}   ${PRIORITY_LABELS[issue.priority] || issue.priority}`);
  console.log('');
}

async function updateIssue(id, flags, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Issue ID is required.'));
    console.error(colors.dim('  Usage: multica issue update <id> --status done'));
    process.exit(1);
  }

  if (Object.keys(flags).length === 0) {
    console.error(colors.red('✗ At least one field to update is required.'));
    console.error(colors.dim('  Usage: multica issue update <id> --status done [--title "..."]'));
    process.exit(1);
  }

  const allowedFields = ['title', 'description', 'status', 'priority', 'assigneeType', 'assigneeId', 'projectId', 'dueDate'];
  const body = {};
  for (const [key, value] of Object.entries(flags)) {
    if (allowedFields.includes(key)) {
      body[key] = value;
    }
  }

  if (Object.keys(body).length === 0) {
    console.error(colors.red('✗ No valid fields to update.'));
    console.error(colors.dim(`  Valid fields: ${allowedFields.join(', ')}`));
    process.exit(1);
  }

  const result = await patch(`/api/issues/${id}`, { body });

  if (!result.ok) {
    handleError(`updating issue ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const issue = result.data;
  console.log('');
  console.log(colors.green(`✓ Issue ${issue.identifier || id} updated successfully`));
  console.log(`  ${colors.bold('Title:')}   ${issue.title}`);
  console.log(`  ${colors.bold('Status:')}  ${STATUS_LABELS[issue.status] || issue.status}`);
  console.log(`  ${colors.bold('Priority:')}${PRIORITY_LABELS[issue.priority] || issue.priority}`);
  console.log('');
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica issue <command> [options]

${colors.bold('Commands:')}
  list              List issues (with optional filters)
  get <id>          Get issue details
  create            Create a new issue
  update <id>       Update an existing issue

${colors.bold('List Options:')}
  --status <s>      Filter by status (backlog, todo, in_progress, in_review, done, blocked, cancelled)
  --priority <p>    Filter by priority (none, low, medium, high, urgent)
  --assigneeType <t> Filter by assignee type (member, agent)
  --projectId <id>  Filter by project
  --search <q>      Search by title or description
  --limit <n>       Limit number of results

${colors.bold('Create Options:')}
  --title <t>       Issue title (required)
  --description <d> Issue description
  --priority <p>    Priority (default: none)
  --status <s>      Status (default: backlog)
  --assigneeType <t> Assignee type (member, agent)
  --assigneeId <id> Assignee ID
  --projectId <id>  Project ID

${colors.bold('Update Options:')}
  --title <t>       New title
  --description <d> New description
  --status <s>      New status
  --priority <p>    New priority
  --assigneeType <t> New assignee type
  --projectId <id>  New project ID

${colors.bold('Global Options:')}
  --json            Output in JSON format
  -h, --help        Show this help message

${colors.bold('Examples:')}
  $ multica issue list
  $ multica issue list --status in_progress --priority high
  $ multica issue get AH-1
  $ multica issue create --title "Fix login redirect" --priority high
  $ multica issue update AH-1 --status done
  $ multica issue list --json
`);
}

module.exports = { run, printHelp, parseArgs };
