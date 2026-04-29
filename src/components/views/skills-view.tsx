'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Wrench,
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
import { Separator } from '@/components/ui/separator'
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

export function SkillsView({ workspaceId }: SkillsViewProps) {
  const [skills, setSkills] = useState<SkillWithAgents[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

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

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      !search ||
      skill.name.toLowerCase().includes(search.toLowerCase()) ||
      skill.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      filterCategory === 'all' || skill.category === filterCategory
    return matchesSearch && matchesCategory
  })

  // Submit handler
  const handleSkillSubmit = async (data: {
    name: string
    description: string
    content: string
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

  // Get agents already using a skill
  const getSkillAgents = (skill: SkillWithAgents) => {
    return skill.agents?.map((a) => a.agent) ?? []
  }

  // Strip markdown for preview
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

  // Agent color generator
  const getAgentColor = (name: string) => {
    const colors = [
      'bg-amber-500',
      'bg-emerald-500',
      'bg-violet-500',
      'bg-rose-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
      'bg-pink-500',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  // Render simple markdown
  const renderMarkdown = (md: string) => {
    const lines = md.split('\n')
    return (
      <div className="prose prose-sm max-w-none dark:prose-invert">
        {lines.map((line, i) => {
          if (line.startsWith('### '))
            return (
              <h3 key={i} className="text-base font-semibold mt-4 mb-1">
                {line.slice(4)}
              </h3>
            )
          if (line.startsWith('## '))
            return (
              <h2 key={i} className="text-lg font-semibold mt-4 mb-1">
                {line.slice(3)}
              </h2>
            )
          if (line.startsWith('# '))
            return (
              <h1 key={i} className="text-xl font-bold mt-4 mb-2">
                {line.slice(2)}
              </h1>
            )
          if (line.startsWith('- ') || line.startsWith('* '))
            return (
              <li key={i} className="text-sm ml-4">
                {line.slice(2)}
              </li>
            )
          if (line.match(/^\d+\. /))
            return (
              <li key={i} className="text-sm ml-4 list-decimal">
                {line.replace(/^\d+\. /, '')}
              </li>
            )
          if (line.trim() === '') return <br key={i} />
          return (
            <p key={i} className="text-sm leading-relaxed">
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Manage reusable agent skills and capabilities
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSkill(null)
            setFormOpen(true)
          }}
        >
          <Plus className="size-4 mr-2" />
          Create Skill
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(SKILL_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Skills Grid */}
      {loading ? (
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
      ) : filteredSkills.length === 0 ? (
        <Card className="gap-4">
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Puzzle className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No skills found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter'
                  : 'Create your first skill to get started'}
              </p>
            </div>
            {!search && filterCategory === 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="size-4 mr-1" />
                Create Skill
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const skillAgents = getSkillAgents(skill)
            const cat = skill.category as SkillCategory
            const preview = stripMarkdown(skill.content).slice(0, 100)

            return (
              <Card
                key={skill.id}
                className="gap-0 py-0 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => setDetailSkill(skill)}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setDetailSkill(skill)
                        }}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingSkill(skill)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(skill)
                        }}
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
                  {cat && (
                    <Badge
                      variant="secondary"
                      className={`text-xs w-fit ${SKILL_CATEGORY_COLORS[cat]}`}
                    >
                      {SKILL_CATEGORY_LABELS[cat]}
                    </Badge>
                  )}

                  {preview && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {preview}
                      {stripMarkdown(skill.content).length > 100 ? '...' : ''}
                    </p>
                  )}

                  {skillAgents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Used by</span>
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
          })}
        </div>
      )}

      {/* Skill Form Dialog */}
      <SkillFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        skill={editingSkill}
        workspaceId={workspaceId}
        onSubmit={handleSkillSubmit}
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSkill(detailSkill)
                        setDetailSkill(null)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAttachSkillId(detailSkill.id)
                      }}
                    >
                      <Link2 className="size-3.5 mr-1" />
                      Attach to Agent
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
                    Source: {detailSkill.source}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs w-fit">
                  {detailSkill.content.length} chars
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
                  Agents using this skill ({getSkillAgents(detailSkill).length})
                </p>
                {getSkillAgents(detailSkill).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No agents are attached to this skill yet.
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
            <DialogTitle>Attach Skill to Agent</DialogTitle>
            <DialogDescription>
              Select an agent to attach this skill to.
            </DialogDescription>
          </DialogHeader>
          <Select value={attachAgentId} onValueChange={setAttachAgentId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an agent..." />
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
              Cancel
            </Button>
            <Button onClick={handleAttachAgent} disabled={!attachAgentId}>
              Attach
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
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be
              undone. Agents that have this skill attached will lose the association.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
