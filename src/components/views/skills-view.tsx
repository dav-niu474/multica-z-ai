'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
  Zap,
  TestTubes,
  ShieldCheck,
  Rocket,
  Puzzle,
  Lock,
  Gauge,
  GitBranch,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Link2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Skill, SkillCategory, Agent, AgentSkill } from '@/types'
import {
  SKILL_CATEGORY_COLORS,
  SKILL_CATEGORY_LABELS,
} from '@/types'
import { SkillFormDialog } from '@/components/skills/skill-form-dialog'
import { useTranslation } from '@/lib/i18n'

// ---- Icon map for categories ----
const CATEGORY_ICONS: Record<SkillCategory, React.ReactNode> = {
  engineering: <Wrench className="size-4" />,
  testing: <TestTubes className="size-4" />,
  review: <ShieldCheck className="size-4" />,
  deployment: <Rocket className="size-4" />,
  custom: <Puzzle className="size-4" />,
  security: <Lock className="size-4" />,
  performance: <Gauge className="size-4" />,
  git: <GitBranch className="size-4" />,
  documentation: <FileText className="size-4" />,
}

interface SkillWithAgents extends Skill {
  agents?: AgentSkill[]
  _count?: { agents: number }
}

interface SkillsViewProps {
  workspaceId: string
}

// ---- Shared Skill Card Component ----
function SkillCard({
  skill,
  onEdit,
  onDelete,
  onViewDetail,
}: {
  skill: SkillWithAgents
  onEdit: (skill: SkillWithAgents) => void
  onDelete: (skill: SkillWithAgents) => void
  onViewDetail: (skill: SkillWithAgents) => void
}) {
  const { t } = useTranslation()
  const skillAgents = skill.agents?.map((a) => a.agent) ?? []
  const cat = skill.category as SkillCategory

  const stripMarkdown = (md: string): string => {
    return md
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^[-*+]\s/gm, '')
      .replace(/^\d+\.\s/gm, '')
      .trim()
  }

  const preview = stripMarkdown(skill.content).slice(0, 100)

  const getAgentColor = (name: string) => {
    const colors = [
      'bg-amber-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
      'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <Card
      className="gap-0 py-0 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onViewDetail(skill)}
    >
      <CardHeader className="px-4 pt-4 pb-2 gap-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex items-center justify-center rounded-lg p-2 shrink-0 ${
                cat && SKILL_CATEGORY_COLORS[cat]
                  ? SKILL_CATEGORY_COLORS[cat].split(' ')[0]
                  : 'bg-gray-100 dark:bg-gray-800'
              }`}
            >
              {cat ? (
                <span
                  className={
                    cat && SKILL_CATEGORY_COLORS[cat]
                      ? SKILL_CATEGORY_COLORS[cat].split(' ').slice(1).join(' ')
                      : 'text-gray-600 dark:text-gray-400'
                  }
                >
                  {CATEGORY_ICONS[cat]}
                </span>
              ) : (
                <Puzzle className="size-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <CardTitle className="text-base truncate">
              {skill.name}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => { e.stopPropagation(); onViewDetail(skill) }}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => { e.stopPropagation(); onEdit(skill) }}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(skill) }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
        {skill.description && (
          <CardDescription className="line-clamp-2 text-xs">
            {skill.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-3">
        {/* Type badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-xs ${
              skill.type === 'tool'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
            }`}
          >
            {skill.type === 'tool' ? (
              <span className="flex items-center gap-1"><Wrench className="size-3" /> {t.skills.toolLabel}</span>
            ) : (
              <span className="flex items-center gap-1"><Zap className="size-3" /> {t.skills.skillLabel}</span>
            )}
          </Badge>
          {cat && (
            <Badge
              variant="secondary"
              className={`text-xs ${SKILL_CATEGORY_COLORS[cat]}`}
            >
              {SKILL_CATEGORY_LABELS[cat]}
            </Badge>
          )}
        </div>

        {preview && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {preview}
            {stripMarkdown(skill.content).length > 100 ? '...' : ''}
          </p>
        )}

        {skillAgents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{t.skills.usedBy}</span>
            <div className="flex -space-x-1.5">
              {skillAgents.slice(0, 3).map((agent) => (
                <Avatar key={agent.id} className="size-6 border-2 border-background">
                  <AvatarFallback
                    className={`text-[10px] font-medium text-white ${getAgentColor(agent.name)}`}
                  >
                    {agent.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {skillAgents.length > 3 && (
                <div className="flex items-center justify-center size-6 rounded-full bg-muted text-[10px] font-medium border-2 border-background">
                  +{skillAgents.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Main Skills View ----
export function SkillsView({ workspaceId }: SkillsViewProps) {
  const { t } = useTranslation()
  const [skills, setSkills] = useState<SkillWithAgents[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [activeTab, setActiveTab] = useState<'all' | 'skill' | 'tool'>('all')

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [formDefaultType, setFormDefaultType] = useState<'skill' | 'tool'>('skill')

  // Detail dialog state
  const [detailSkill, setDetailSkill] = useState<SkillWithAgents | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SkillWithAgents | null>(null)

  // Attach agent state
  const [attachSkillId, setAttachSkillId] = useState<string | null>(null)
  const [attachAgentId, setAttachAgentId] = useState('')

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch(`/api/skills?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setSkills(data)
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err)
    }
  }, [workspaceId])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }, [workspaceId])

  useEffect(() => {
    Promise.all([fetchSkills(), fetchAgents()]).finally(() => setLoading(false))
  }, [fetchSkills, fetchAgents])

  // Filter skills by tab + search + category
  const filteredSkills = skills.filter((skill) => {
    const matchesTab = activeTab === 'all' || skill.type === activeTab
    const matchesSearch =
      !search ||
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      filterCategory === 'all' || skill.category === filterCategory
    return matchesTab && matchesSearch && matchesCategory
  })

  // Stats
  const skillCount = skills.filter(s => s.type === 'skill').length
  const toolCount = skills.filter(s => s.type === 'tool').length

  // Submit handler
  const handleSkillSubmit = async (data: {
    name: string
    description: string
    content: string
    type: 'skill' | 'tool'
    category: SkillCategory | null
    source: string
    workspaceId: string
  }) => {
    if (editingSkill) {
      const res = await fetch(`/api/skills/${editingSkill.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update skill')
    } else {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create skill')
    }
    await fetchSkills()
    setEditingSkill(null)
  }

  // Delete handler
  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/skills/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSkills((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      }
    } catch (err) {
      console.error('Failed to delete skill:', err)
    } finally {
      setDeleteTarget(null)
    }
  }

  // Attach skill to agent
  const handleAttachAgent = async () => {
    if (!attachSkillId || !attachAgentId) return
    try {
      const res = await fetch(`/api/agents/${attachAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addSkillId: attachSkillId }),
      })
      if (res.ok) {
        await fetchSkills()
        await fetchAgents()
      }
    } catch (err) {
      console.error('Failed to attach skill:', err)
    } finally {
      setAttachSkillId(null)
      setAttachAgentId('')
    }
  }

  // Open create form with specific type
  const openCreateForm = (type: 'skill' | 'tool') => {
    setEditingSkill(null)
    setFormDefaultType(type)
    setFormOpen(true)
  }

  // Open edit form
  const openEditForm = (skill: SkillWithAgents) => {
    setEditingSkill(skill)
    setFormDefaultType(skill.type as 'skill' | 'tool')
    setFormOpen(true)
  }

  // Get agents already using a skill
  const getSkillAgents = (skill: SkillWithAgents) => {
    return skill.agents?.map((a) => a.agent) ?? []
  }

  // Render simple markdown
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n')
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {lines.map((line, i) => {
          if (line.startsWith('### '))
            return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>
          if (line.startsWith('## '))
            return <h2 key={i} className="text-lg font-semibold mt-4 mb-1">{line.slice(3)}</h2>
          if (line.startsWith('# '))
            return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
          if (line.startsWith('- ') || line.startsWith('* '))
            return <li key={i} className="text-sm ml-4">{line.slice(2)}</li>
          if (line.match(/^\d+\. /))
            return <li key={i} className="text-sm ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>
          if (line.trim() === '') return <br key={i} />
          return <p key={i} className="text-sm leading-relaxed">{line}</p>
        })}
      </div>
    )
  }

  const getAgentColor = (name: string) => {
    const colors = [
      'bg-amber-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
      'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Loading skeleton
  const renderLoadingGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="gap-4">
          <CardHeader className="pb-0">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-4 w-24 mt-4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Empty state
  const renderEmpty = (tabType: 'all' | 'skill' | 'tool') => {
    const label = tabType === 'tool' ? t.skills.toolLabel : tabType === 'skill' ? t.skills.skillLabel : ''
    return (
      <Card className="gap-4">
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <Puzzle className="size-10 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t.skills.noSkillsFound}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || filterCategory !== 'all'
                ? t.skills.tryAdjusting
                : t.skills.createFirstSkill}
            </p>
          </div>
          {!search && filterCategory === 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCreateForm(tabType === 'tool' ? 'tool' : tabType === 'skill' ? 'skill' : 'skill')}
            >
              <Plus className="size-4 mr-1" />
              {tabType === 'tool'
                ? `${t.skills.createTool}`
                : tabType === 'skill'
                ? `${t.skills.createSkill}`
                : t.skills.createSkill}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.skills.title}</h2>
          <p className="text-sm text-muted-foreground">
            {t.skills.subtitle}
          </p>
        </div>
        <Button onClick={() => openCreateForm('skill')}>
          <Plus className="size-4 mr-2" />
          {t.skills.createSkill}
        </Button>
      </div>

      {/* Tabs: Skills | Tools | All */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <div className="flex flex-col sm:flex-row gap-3">
          <TabsList className="shrink-0">
            <TabsTrigger value="all" className="gap-1.5">
              <Zap className="size-3.5" />
              {t.nav.skills} ({skills.length})
            </TabsTrigger>
            <TabsTrigger value="skill" className="gap-1.5">
              <Zap className="size-3.5 text-amber-500" />
              {t.skills.skillLabel} ({skillCount})
            </TabsTrigger>
            <TabsTrigger value="tool" className="gap-1.5">
              <Wrench className="size-3.5 text-emerald-500" />
              {t.skills.toolLabel} ({toolCount})
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder={t.skills.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t.skills.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.skills.allCategories}</SelectItem>
                {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Skills Tab */}
        <TabsContent value="skill" className="mt-4">
          {loading ? (
            renderLoadingGrid()
          ) : filteredSkills.length === 0 ? (
            renderEmpty('skill')
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                  onViewDetail={setDetailSkill}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tool" className="mt-4">
          {loading ? (
            renderLoadingGrid()
          ) : filteredSkills.length === 0 ? (
            renderEmpty('tool')
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                  onViewDetail={setDetailSkill}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all" className="mt-4">
          {loading ? (
            renderLoadingGrid()
          ) : filteredSkills.length === 0 ? (
            renderEmpty('all')
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={openEditForm}
                  onDelete={setDeleteTarget}
                  onViewDetail={setDetailSkill}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Skill Form Dialog - key forces remount when switching create/edit */}
      <SkillFormDialog
        key={editingSkill?.id ?? `create-${formDefaultType}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        skill={editingSkill}
        workspaceId={workspaceId}
        onSubmit={handleSkillSubmit}
        defaultType={formDefaultType}
      />

      {/* Skill Detail Dialog */}
      <Dialog
        open={!!detailSkill}
        onOpenChange={(open) => {
          if (!open) setDetailSkill(null)
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {detailSkill && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3">
                  {detailSkill.category && (
                    <div
                      className={`flex items-center justify-center rounded-lg p-2 ${
                        SKILL_CATEGORY_COLORS[detailSkill.category as SkillCategory]?.split(' ')[0] ??
                        'bg-gray-100'
                      }`}
                    >
                      {CATEGORY_ICONS[detailSkill.category as SkillCategory]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg">{detailSkill.name}</DialogTitle>
                    {detailSkill.description && (
                      <DialogDescription className="mt-1">
                        {detailSkill.description}
                      </DialogDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        detailSkill.type === 'tool'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      }`}
                    >
                      {detailSkill.type === 'tool' ? (
                        <span className="flex items-center gap-1"><Wrench className="size-3" /> {t.skills.toolLabel}</span>
                      ) : (
                        <span className="flex items-center gap-1"><Zap className="size-3" /> {t.skills.skillLabel}</span>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        openEditForm(detailSkill)
                        setDetailSkill(null)
                      }}
                    >
                      <Pencil className="size-3.5 mr-1" />
                      {t.common.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAttachSkillId(detailSkill.id)
                      }}
                    >
                      <Link2 className="size-3.5 mr-1" />
                      {t.skills.attachToAgent}
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-4 border-b pb-4">
                {detailSkill.category && (
                  <Badge
                    variant="secondary"
                    className={`text-xs w-fit ${SKILL_CATEGORY_COLORS[detailSkill.category as SkillCategory]}`}
                  >
                    {SKILL_CATEGORY_LABELS[detailSkill.category as SkillCategory]}
                  </Badge>
                )}
                {detailSkill.source && (
                  <Badge variant="outline" className="text-xs w-fit">
                    {t.skills.source}: {detailSkill.source}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs w-fit">
                  {detailSkill.content.length} {t.common.chars}
                </Badge>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="py-2">
                  {renderMarkdown(detailSkill.content)}
                </div>
              </ScrollArea>

              {/* Agents using this skill */}
              <div className="border-t pt-4 shrink-0">
                <p className="text-sm font-medium mb-2">
                  {t.skills.agentsUsingSkill(getSkillAgents(detailSkill).length)}
                </p>
                {getSkillAgents(detailSkill).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t.skills.noAgentsAttached}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getSkillAgents(detailSkill).map((agent) => (
                      <Badge key={agent.id} variant="outline" className="text-xs gap-1.5">
                        <span
                          className={`size-2 rounded-full ${getAgentColor(agent.name)}`}
                        />
                        {agent.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Attach to Agent Dialog */}
      <Dialog
        open={!!attachSkillId}
        onOpenChange={(open) => {
          if (!open) {
            setAttachSkillId(null)
            setAttachAgentId('')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.skills.attachSkillToAgent}</DialogTitle>
            <DialogDescription>
              {t.skills.attachSkillDesc}
            </DialogDescription>
          </DialogHeader>
          <Select value={attachAgentId} onValueChange={setAttachAgentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.skills.chooseAgentPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAttachSkillId(null)
                setAttachAgentId('')
              }}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={handleAttachAgent} disabled={!attachAgentId}>
              {t.common.attach}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.skills.deleteSkill}</DialogTitle>
            <DialogDescription>
              {t.skills.deleteSkillDesc.replace('{name}', deleteTarget?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
