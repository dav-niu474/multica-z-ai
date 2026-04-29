import type { TranslationKeys } from './en';

const zh: TranslationKeys = {
  // ==================== 通用 ====================
  common: {
    save: '保存',
    saveChanges: '保存更改',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    close: '关闭',
    confirm: '确认',
    search: '搜索',
    filter: '筛选',
    create: '创建',
    loading: '加载中...',
    retry: '重试',
    noResults: '未找到结果',
    error: '发生错误',
    failedToFetch: '获取数据失败',
    actions: '操作',
    name: '名称',
    description: '描述',
    status: '状态',
    priority: '优先级',
    assignee: '负责人',
    labels: '标签',
    project: '项目',
    all: '全部',
    none: '无',
    yes: '是',
    no: '否',
    or: '或',
    saving: '保存中...',
    attach: '关联',
    chars: '字符',
    tasks: '任务',
    task: '任务',
    issues: '议题',
    issue: '议题',
    more: '更多',
    back: '返回',
    next: '下一步',
    previous: '上一步',
  },

  // ==================== 导航 ====================
  nav: {
    dashboard: '仪表盘',
    agents: '智能体',
    issues: '议题',
    chat: '聊天',
    skills: '技能',
    projects: '项目',
    patterns: '编排模式',
    settings: '设置',
    collapse: '收起',
  },

  // ==================== 侧边栏 ====================
  sidebar: {
    teamCollaboration: '团队协作',
    free: '免费版',
    navigation: '导航',
    toggleSidebar: '切换侧边栏',
  },

  // ==================== 工作区 ====================
  workspace: {
    noWorkspaceFound: '未找到工作区。',
    loadingWorkspace: '正在加载工作区...',
    failedToLoadWorkspace: '加载工作区失败',
  },

  // ==================== 仪表盘 ====================
  dashboard: {
    title: '仪表盘',
    subtitle: '工作区活动概览',
    failedToLoad: '加载仪表盘失败',
    totalIssues: '总议题数',
    completed: '已完成',
    activeAgents: '活跃智能体',
    currentlyWorking: '正在工作中',
    openTasks: '进行中任务',
    runningNow: '当前运行',
    completionRate: '完成率',
    issuesResolved: '已解决议题',
    agentStatus: '智能体状态',
    agentsInWorkspace: (count: number) => `工作区中共 ${count} 个智能体`,
    noAgentsConfigured: '暂无智能体配置',
    issueDistribution: '议题分布',
    issuesTotal: (count: number) => `共 ${count} 个议题`,
    noIssues: '暂无议题',
    recentActivity: '最近活动',
    latestWorkspaceEvents: '最新工作区事件',
    noRecentActivity: '暂无最近活动',
    system: '系统',
    agent: '智能体',
    member: '成员',
  },

  // ==================== 智能体状态 ====================
  agentStatus: {
    idle: '空闲',
    working: '工作中',
    blocked: '阻塞',
    error: '异常',
    offline: '离线',
  },

  // ==================== 智能体提供商 ====================
  agentProvider: {
    claude: 'Claude Code',
    codex: 'Codex',
    openai: 'OpenAI',
    gemini: 'Gemini',
    custom: '自定义',
  },

  // ==================== 智能体可见性 ====================
  agentVisibility: {
    workspace: '工作区',
    private: '私有',
  },

  // ==================== 智能体视图 ====================
  agents: {
    title: '智能体',
    subtitle: '管理工作区中的 AI 智能体',
    failedToLoad: '加载智能体失败',
    createAgent: '创建智能体',
    noAgentsYet: '暂无智能体',
    createFirstAgent: '创建你的第一个 AI 智能体以开始使用',
    editAgent: '编辑智能体',
    createAgentTitle: '创建智能体',
    editAgentDesc: '更新智能体配置和设置',
    createAgentDesc: '为你的工作区配置一个新的 AI 智能体',
    // 表单字段
    nameLabel: '名称',
    namePlaceholder: '例如 Claude Code',
    nameRequired: '智能体名称为必填项',
    descriptionPlaceholder: '简要描述该智能体的功能',
    provider: '提供商',
    visibility: '可见性',
    maxConcurrentTasks: '最大并发任务数',
    maxConcurrentDesc: '该智能体可同时处理的最大任务数',
    instructions: '指令 / 系统提示词',
    instructionsPlaceholder: '输入智能体的系统提示词或指令...',
    attachedSkills: '已关联技能',
    noSkillsAvailable: '暂无可用技能。请先创建技能。',
    skillsSelected: (count: number) =>
      `已选择 ${count} 个技能`,
    // 操作
    pause: '暂停',
    activate: '激活',
    deleteConfirm: '删除 "{name}"？',
    deleteConfirmDesc:
      '此操作不可撤销。该智能体及其所有关联任务将被永久删除。',
    deleteSuccess: '智能体已成功删除',
    nowIs: (name: string, status: string) => `${name} 现在为 ${status}`,
    unknownSkill: '未知技能',
  },

  // ==================== 议题状态 ====================
  issueStatus: {
    backlog: '待办池',
    todo: '待办',
    in_progress: '进行中',
    in_review: '审核中',
    done: '已完成',
    cancelled: '已取消',
  },

  // ==================== 议题优先级 ====================
  issuePriority: {
    none: '无优先级',
    none_short: '无',
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  },

  // ==================== 议题视图 ====================
  issues: {
    title: '议题',
    createIssue: '创建议题',
    createNewIssue: '创建新议题',
    noIssuesInColumn: '暂无议题',
    noIssuesFound: '未找到议题',
    unassigned: '未指派',
    // 表单字段
    titleLabel: '标题',
    titlePlaceholder: '简要描述议题...',
    descriptionPlaceholder: '添加更详细的描述...',
    selectPriority: '选择优先级',
    selectProject: '选择项目（可选）',
    noProject: '无项目',
    selectAssigneeType: '选择负责人类型',
    selectAgent: '选择智能体',
    chooseAgent: '选择智能体...',
    memberId: '成员 ID',
    memberIdPlaceholder: '输入成员 ID...',
    addLabel: '添加标签...',
    labelAdded: '标签',
    // 表格表头
    id: 'ID',
    titleHeader: '标题',
    statusHeader: '状态',
    priorityHeader: '优先级',
    assigneeHeader: '负责人',
    labelsHeader: '标签',
    createdHeader: '创建时间',
    // 详情面板
    comments: '评论',
    addComment: '添加评论...',
    pressCtrlEnter: '按 Ctrl+Enter 发送',
    noDescription: '暂无描述',
    // 项目分解
    backlog: '待办池',
    todo: '待办',
    active: '进行中',
    review: '审核中',
    done: '已完成',
    hideIssues: '隐藏议题',
    viewIssues: (count: number) => `查看议题 (${count})`,
  },

  // ==================== 聊天视图 ====================
  chat: {
    title: '聊天',
    newChat: '新聊天',
    noConversationsYet: '暂无会话',
    noMessagesYet: '暂无消息',
    sendMessagePlaceholder: (name?: string) =>
      `发送消息给 ${name || '智能体'}...`,
    sendHint: '按 Enter 发送',
    selectConversation: '选择一个会话',
    selectOrCreate: '选择一个会话或创建新会话',
    // 对话框
    newChatTitle: '新聊天',
    selectAgent: '选择智能体（可选）',
    generalChatNoAgent: '通用聊天（无智能体）',
    generalNoAgent: '通用（无智能体）',
    startChat: '开始聊天',
    // 状态消息
    receivedProcessing: (name: string) =>
      `[${name}] 已收到你的消息。正在处理你的请求，将尽快回复。`,
    messageReceived: '消息已收到。正在处理...',
  },

  // ==================== 技能分类 ====================
  skillCategory: {
    engineering: '工程开发',
    testing: '测试',
    review: '代码审查',
    deployment: '部署',
    custom: '自定义',
    security: '安全',
    performance: '性能',
    git: 'Git',
    documentation: '文档',
  },

  // ==================== 技能视图 ====================
  skills: {
    title: '技能与工具',
    subtitle: '管理可复用的智能体技能和能力',
    createSkill: '创建技能',
    createTool: '创建工具',
    skillLabel: '技能',
    toolLabel: '工具',
    typeLabel: '类型',
    selectType: '选择类型',
    selectCategory: '选择分类',
    selectSource: '选择来源',
    noSkillsFound: '未找到技能',
    tryAdjusting: '尝试调整搜索或筛选条件',
    createFirstSkill: '创建你的第一个技能以开始使用',
    searchPlaceholder: '搜索技能...',
    category: '分类',
    allCategories: '所有分类',
    usedBy: '被使用于',
    // 详情
    edit: '编辑',
    attachToAgent: '关联到智能体',
    source: '来源',
    agentsUsingSkill: (count: number) =>
      `使用此技能的智能体 (${count})`,
    noAgentsAttached: '暂无智能体关联此技能。',
    // 表单
    editSkill: '编辑技能',
    editTool: '编辑工具',
    createSkillTitle: '创建技能',
    createToolTitle: '创建工具',
    editSkillDesc: '更新技能详情和内容。',
    createSkillDesc: '定义一个新的技能，可以关联到智能体。',
    createToolDesc: '定义一个新的工具，可以供智能体使用。',
    namePlaceholder: '例如：代码审查、TDD 工作流',
    descriptionPlaceholder: '简要描述此技能涵盖的内容',
    contentMarkdown: '内容（Markdown）',
    contentPlaceholder: '# 技能内容\n\n用 Markdown 编写技能指令...',
    contentLength: (count: number) =>
      `${count} 字符 — 使用 Markdown 格式编写富文本内容`,
    // 来源选项
    sourceManual: '手动输入',
    sourceUrlImport: 'URL 导入',
    sourceFileImport: '文件导入',
    // 关联对话框
    attachSkillToAgent: '关联技能到智能体',
    attachSkillDesc: '选择一个智能体来关联此技能。',
    chooseAgentPlaceholder: '选择智能体...',
    // 删除对话框
    deleteSkill: '删除技能',
    deleteSkillDesc:
      '确定要删除 "{name}" 吗？此操作不可撤销。关联此技能的智能体将失去该技能。',
  },

  // ==================== 项目状态 ====================
  projectStatus: {
    planned: '已规划',
    in_progress: '进行中',
    paused: '已暂停',
    completed: '已完成',
    cancelled: '已取消',
  },

  // ==================== 项目视图 ====================
  projects: {
    title: '项目',
    subtitle: '将议题组织到项目中并追踪团队进度',
    createProject: '创建项目',
    noProjectsYet: '暂无项目',
    noProjectsDesc: '创建一个项目来组织和追踪团队的议题',
    // 表单
    editProject: '编辑项目',
    createProjectTitle: '创建项目',
    editProjectDesc: '更新项目详情。',
    createProjectDesc: '创建一个新项目来组织议题并追踪进度。',
    icon: '图标',
    namePlaceholder: '例如：API 网关 v2',
    descPlaceholder: '简要描述项目目标',
    selectStatus: '选择状态',
    selectPriority: '选择优先级',
    updateProject: '更新项目',
    // 删除
    deleteProject: '删除项目',
    deleteProjectDesc:
      '确定要删除 "{name}" 吗？该项目中的议题不会被删除，但将不再与此项目关联。',
  },

  // ==================== 编排模式视图 ====================
  patterns: {
    title: '智能体编排模式',
    subtitle: '构建多智能体工作流的参考指南',
    introText:
      '基于智能体技能框架，这五种模式涵盖了从简单的单智能体调用到复杂的并行编排的完整谱系。根据任务复杂度、可并行性和成本约束选择合适的模式。',
    // 模式标签
    useWhen: '适用场景：',
    example: '示例：',
    cost: '成本',
    // 反模式
    antiPatterns: '反模式',
    antiPatternsSubtitle: '编排智能体时应避免的常见错误',
    fix: '修复方案',
    severity: '严重程度',
    // 快速参考
    quickReference: '快速参考：模式选择指南',
    quickReferenceDesc: '使用此决策矩阵选择合适的模式',
    criteria: '评估标准',
    complexity: '复杂度',
    speed: '速度',
    costLabel: '成本',
    parallelizable: '可并行',
    agentsNeeded: '所需智能体',
  },

  // ==================== 设置视图 ====================
  settings: {
    title: '设置',
    language: '语言',
    languageDesc: '选择界面显示语言',
    theme: '主题',
    themeDesc: '自定义应用外观',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    about: '关于',
    aboutDesc: '关于 AgentHub 的信息',
    appName: 'AgentHub',
    appVersion: '版本',
    appDescription:
      'AgentHub 是一个 AI 驱动的团队协作平台，帮助你管理 AI 智能体、追踪议题、编排多智能体工作流。',
    githubRepo: 'GitHub 仓库',
    visitGithub: '访问 GitHub',
  },
};

export default zh;
