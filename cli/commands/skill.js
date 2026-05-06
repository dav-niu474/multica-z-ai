const { get, handleError, colors } = require('../lib/api');
const { printTable } = require('../lib/table');

const TYPE_LABELS = {
  skill: 'Skill',
  tool: 'Tool',
};

/**
 * Run the skill command.
 * @param {string} subcommand
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
      await listSkills(jsonMode);
      break;
    case 'get':
      await getSkill(cleanArgs[0], jsonMode);
      break;
    default:
      console.error(colors.red(`✗ Unknown skill command: "${subcommand}"`));
      console.error(colors.dim('  Run "multica skill --help" for usage.'));
      process.exit(1);
  }
}

async function listSkills(jsonMode) {
  const result = await get('/api/skills');

  if (!result.ok) {
    handleError('listing skills', result, jsonMode);
  }

  const skills = Array.isArray(result.data) ? result.data : [];

  if (jsonMode) {
    console.log(JSON.stringify(skills, null, 2));
    return;
  }

  if (skills.length === 0) {
    console.log(colors.dim('No skills found.'));
    return;
  }

  const headers = ['Name', 'Type', 'Category', 'Agents', 'Source'];
  const rows = skills.map(skill => [
    skill.name || '-',
    TYPE_LABELS[skill.type] || skill.type || '-',
    skill.category || '-',
    String(skill.agentCount || 0),
    skill.source || '-',
  ]);

  printTable(headers, rows);
}

async function getSkill(id, jsonMode) {
  if (!id) {
    console.error(colors.red('✗ Skill ID is required.'));
    console.error(colors.dim('  Usage: multica skill get <id>'));
    process.exit(1);
  }

  const result = await get(`/api/skills/${id}`);

  if (!result.ok) {
    handleError(`fetching skill ${id}`, result, jsonMode);
  }

  if (jsonMode) {
    console.log(JSON.stringify(result.data, null, 2));
    return;
  }

  const skill = result.data;
  console.log('');
  console.log(`${colors.bold('Name:')}       ${skill.name}`);
  console.log(`${colors.bold('ID:')}         ${skill.id}`);
  console.log(`${colors.bold('Type:')}       ${TYPE_LABELS[skill.type] || skill.type || '-'}`);
  console.log(`${colors.bold('Category:')}   ${skill.category || '-'}`);
  if (skill.description) {
    console.log(`${colors.bold('Description:')} ${skill.description}`);
  }
  if (skill.source) {
    console.log(`${colors.bold('Source:')}     ${skill.source}`);
  }
  console.log(`${colors.bold('Agent Count:')} ${skill.agentCount || 0}`);
  console.log(`${colors.bold('Created:')}    ${skill.createdAt ? new Date(skill.createdAt).toLocaleString() : '-'}`);
  console.log('');
}

function printHelp() {
  console.log(`
${colors.bold('Usage:')} multica skill <command> [options]

${colors.bold('Commands:')}
  list              List all skills
  get <id>          Get skill details

${colors.bold('Global Options:')}
  --json            Output in JSON format
  -h, --help        Show this help message

${colors.bold('Examples:')}
  $ multica skill list
  $ multica skill get <skill-id>
  $ multica skill list --json
`);
}

module.exports = { run, printHelp };
