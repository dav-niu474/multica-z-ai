const en = {
  // ==================== Common ====================
  common: {
    save: 'Save',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    search: 'Search',
    filter: 'Filter',
    create: 'Create',
    loading: 'Loading...',
    retry: 'Retry',
    noResults: 'No results found',
    error: 'An error occurred',
    failedToFetch: 'Failed to fetch data',
    actions: 'Actions',
    name: 'Name',
    description: 'Description',
    status: 'Status',
    priority: 'Priority',
    assignee: 'Assignee',
    labels: 'Labels',
    project: 'Project',
    all: 'All',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    saving: 'Saving...',
    attach: 'Attach',
    chars: 'chars',
    tasks: 'tasks',
    task: 'task',
    issues: 'issues',
    issue: 'issue',
    more: 'more',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
  },

  // ==================== Navigation ====================
  nav: {
    dashboard: 'Dashboard',
    agents: 'Agents',
    issues: 'Issues',
    chat: 'Chat',
    skills: 'Skills',
    projects: 'Projects',
    patterns: 'Patterns',
    settings: 'Settings',
    collapse: 'Collapse',
  },

  // ==================== Sidebar ====================
  sidebar: {
    teamCollaboration: 'Team Collaboration',
    free: 'Free',
    navigation: 'Navigation',
    toggleSidebar: 'Toggle sidebar',
  },

  // ==================== Workspace ====================
  workspace: {
    noWorkspaceFound: 'No workspace found.',
    loadingWorkspace: 'Loading workspace...',
    failedToLoadWorkspace: 'Failed to load workspace',
  },

  // ==================== Dashboard ====================
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your workspace activity',
    failedToLoad: 'Failed to load dashboard',
    totalIssues: 'Total Issues',
    completed: 'completed',
    activeAgents: 'Active Agents',
    currentlyWorking: 'Currently working',
    openTasks: 'Open Tasks',
    runningNow: 'Running now',
    completionRate: 'Completion Rate',
    issuesResolved: 'Issues resolved',
    agentStatus: 'Agent Status',
    agentsInWorkspace: (count: number) => `${count} agents in workspace`,
    noAgentsConfigured: 'No agents configured yet',
    issueDistribution: 'Issue Distribution',
    issuesTotal: (count: number) => `${count} issues total`,
    noIssues: 'No issues yet',
    recentActivity: 'Recent Activity',
    latestWorkspaceEvents: 'Latest workspace events',
    noRecentActivity: 'No recent activity',
    system: 'System',
    agent: 'Agent',
    member: 'Member',
  },

  // ==================== Agent Status ====================
  agentStatus: {
    idle: 'Idle',
    working: 'Working',
    blocked: 'Blocked',
    error: 'Error',
    offline: 'Offline',
  },

  // ==================== Agent Providers ====================
  agentProvider: {
    claude: 'Claude Code',
    codex: 'Codex',
    openai: 'OpenAI',
    gemini: 'Gemini',
    custom: 'Custom',
  },

  // ==================== Agent Visibility ====================
  agentVisibility: {
    workspace: 'Workspace',
    private: 'Private',
  },

  // ==================== Agents View ====================
  agents: {
    title: 'Agents',
    subtitle: 'Manage AI agents in your workspace',
    failedToLoad: 'Failed to load agents',
    createAgent: 'Create Agent',
    noAgentsYet: 'No agents yet',
    createFirstAgent: 'Create your first AI agent to get started',
    editAgent: 'Edit Agent',
    createAgentTitle: 'Create Agent',
    editAgentDesc: 'Update agent configuration and settings',
    createAgentDesc: 'Configure a new AI agent for your workspace',
    // Form fields
    nameLabel: 'Name',
    namePlaceholder: 'e.g. Claude Code',
    nameRequired: 'Agent name is required',
    descriptionPlaceholder: 'Brief description of what this agent does',
    provider: 'Provider',
    visibility: 'Visibility',
    maxConcurrentTasks: 'Max Concurrent Tasks',
    maxConcurrentDesc: 'Maximum number of tasks this agent can handle simultaneously',
    instructions: 'Instructions / System Prompt',
    instructionsPlaceholder: 'Enter system prompt or instructions for the agent...',
    attachedSkills: 'Attached Skills',
    noSkillsAvailable: 'No skills available. Create skills first.',
    skillsSelected: (count: number) =>
      `${count} skill${count !== 1 ? 's' : ''} selected`,
    // Actions
    pause: 'Pause',
    activate: 'Activate',
    deleteConfirm: 'Delete "{name}"?',
    deleteConfirmDesc:
      'This action cannot be undone. The agent and all associated tasks will be permanently deleted.',
    deleteSuccess: 'Agent deleted successfully',
    nowIs: (name: string, status: string) => `${name} is now ${status}`,
    unknownSkill: 'Unknown Skill',
  },

  // ==================== Issue Status ====================
  issueStatus: {
    backlog: 'Backlog',
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    cancelled: 'Cancelled',
  },

  // ==================== Issue Priority ====================
  issuePriority: {
    none: 'No Priority',
    none_short: 'None',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  },

  // ==================== Issues View ====================
  issues: {
    title: 'Issues',
    createIssue: 'Create Issue',
    createNewIssue: 'Create New Issue',
    noIssuesInColumn: 'No issues',
    noIssuesFound: 'No issues found',
    unassigned: 'Unassigned',
    // Form fields
    titleLabel: 'Title',
    titlePlaceholder: 'Brief summary of the issue...',
    descriptionPlaceholder: 'Add a more detailed description...',
    selectPriority: 'Select priority',
    selectProject: 'Select project (optional)',
    noProject: 'No project',
    selectAssigneeType: 'Select assignee type',
    selectAgent: 'Select Agent',
    chooseAgent: 'Choose an agent...',
    memberId: 'Member ID',
    memberIdPlaceholder: 'Enter member ID...',
    addLabel: 'Add a label...',
    labelAdded: 'Label',
    // Table headers
    id: 'ID',
    titleHeader: 'Title',
    statusHeader: 'Status',
    priorityHeader: 'Priority',
    assigneeHeader: 'Assignee',
    labelsHeader: 'Labels',
    createdHeader: 'Created',
    // Detail panel
    comments: 'Comments',
    addComment: 'Add a comment...',
    pressCtrlEnter: 'Press Ctrl+Enter to send',
    noDescription: 'No description provided',
    // Project breakdown
    backlog: 'backlog',
    todo: 'todo',
    active: 'active',
    review: 'review',
    done: 'done',
    hideIssues: 'Hide Issues',
    viewIssues: (count: number) => `View Issues (${count})`,
  },

  // ==================== Chat View ====================
  chat: {
    title: 'Chats',
    newChat: 'New Chat',
    noConversationsYet: 'No conversations yet',
    noMessagesYet: 'No messages yet',
    sendMessagePlaceholder: (name?: string) =>
      `Message ${name || 'agent'}...`,
    sendHint: 'Press Enter to send',
    selectConversation: 'Select a conversation',
    selectOrCreate: 'Select a conversation or create a new one',
    // Dialog
    newChatTitle: 'New Chat',
    selectAgent: 'Select Agent (optional)',
    generalChatNoAgent: 'General chat (no agent)',
    generalNoAgent: 'General (no agent)',
    startChat: 'Start Chat',
    // Status messages
    receivedProcessing: (name: string) =>
      `[${name}] Received your message. I'm processing your request and will respond shortly.`,
    messageReceived: 'Message received. Processing...',
  },

  // ==================== Skill Categories ====================
  skillCategory: {
    engineering: 'Engineering',
    testing: 'Testing',
    review: 'Review',
    deployment: 'Deployment',
    custom: 'Custom',
    security: 'Security',
    performance: 'Performance',
    git: 'Git',
    documentation: 'Documentation',
  },

  // ==================== Skills View ====================
  skills: {
    title: 'Skills',
    subtitle: 'Manage reusable agent skills and capabilities',
    createSkill: 'Create Skill',
    noSkillsFound: 'No skills found',
    tryAdjusting: 'Try adjusting your search or filter',
    createFirstSkill: 'Create your first skill to get started',
    searchPlaceholder: 'Search skills...',
    category: 'Category',
    allCategories: 'All Categories',
    usedBy: 'Used by',
    // Detail
    edit: 'Edit',
    attachToAgent: 'Attach to Agent',
    source: 'Source',
    agentsUsingSkill: (count: number) =>
      `Agents using this skill (${count})`,
    noAgentsAttached: 'No agents are attached to this skill yet.',
    // Form
    editSkill: 'Edit Skill',
    createSkillTitle: 'Create Skill',
    editSkillDesc: 'Update the skill details and content.',
    createSkillDesc: 'Define a new skill that can be attached to agents.',
    namePlaceholder: 'e.g. Code Review, TDD Workflow',
    descriptionPlaceholder: 'Brief description of what this skill covers',
    contentMarkdown: 'Content (Markdown)',
    contentPlaceholder: '# Skill Content\n\nWrite your skill instructions in markdown...',
    contentLength: (count: number) =>
      `${count} characters — Use markdown formatting for rich content`,
    // Source options
    sourceManual: 'Manual',
    sourceUrlImport: 'URL Import',
    sourceFileImport: 'File Import',
    // Attach dialog
    attachSkillToAgent: 'Attach Skill to Agent',
    attachSkillDesc: 'Select an agent to attach this skill to.',
    chooseAgentPlaceholder: 'Choose an agent...',
    // Delete dialog
    deleteSkill: 'Delete Skill',
    deleteSkillDesc:
      'Are you sure you want to delete "{name}"? This action cannot be undone. Agents that have this skill attached will lose the association.',
  },

  // ==================== Project Status ====================
  projectStatus: {
    planned: 'Planned',
    in_progress: 'In Progress',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  },

  // ==================== Projects View ====================
  projects: {
    title: 'Projects',
    subtitle: 'Organize issues into projects and track team progress',
    createProject: 'Create Project',
    noProjectsYet: 'No projects yet',
    noProjectsDesc:
      'Create a project to organize and track your team\'s issues',
    // Form
    editProject: 'Edit Project',
    createProjectTitle: 'Create Project',
    editProjectDesc: 'Update the project details.',
    createProjectDesc:
      'Create a new project to organize issues and track progress.',
    icon: 'Icon',
    namePlaceholder: 'e.g. API Gateway v2',
    descPlaceholder: 'Brief description of the project goals',
    selectStatus: 'Select status',
    selectPriority: 'Select priority',
    updateProject: 'Update Project',
    // Delete
    deleteProject: 'Delete Project',
    deleteProjectDesc:
      'Are you sure you want to delete "{name}"? The issues in this project will not be deleted, but they will no longer be associated with this project.',
  },

  // ==================== Patterns View ====================
  patterns: {
    title: 'Agent Orchestration Patterns',
    subtitle: 'Reference guide for structuring multi-agent workflows',
    introText:
      'Based on the agent-skills framework, these five patterns cover the spectrum from simple single-agent invocations to complex parallel orchestration. Choose the right pattern based on task complexity, parallelizability, and cost constraints.',
    // Pattern labels
    useWhen: 'Use when:',
    example: 'Example:',
    cost: 'cost',
    // Anti-patterns
    antiPatterns: 'Anti-Patterns',
    antiPatternsSubtitle:
      'Common mistakes to avoid when orchestrating agents',
    fix: 'Fix',
    severity: 'severity',
    // Quick Reference
    quickReference: 'Quick Reference: Pattern Selection Guide',
    quickReferenceDesc: 'Use this decision matrix to choose the right pattern',
    criteria: 'Criteria',
    complexity: 'Complexity',
    speed: 'Speed',
    costLabel: 'Cost',
    parallelizable: 'Parallelizable',
    agentsNeeded: 'Agents Needed',
  },

  // ==================== Settings View ====================
  settings: {
    title: 'Settings',
    language: 'Language',
    languageDesc: 'Choose your preferred language for the interface',
    theme: 'Theme',
    themeDesc: 'Customize the appearance of the application',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    about: 'About',
    aboutDesc: 'Information about AgentHub',
    appName: 'AgentHub',
    appVersion: 'Version',
    appDescription:
      'AgentHub is an AI-powered team collaboration platform that helps you manage AI agents, track issues, and orchestrate multi-agent workflows.',
    githubRepo: 'GitHub Repository',
    visitGithub: 'Visit GitHub',
  },
} as const;

export type TranslationKeys = typeof en;
export default en;
