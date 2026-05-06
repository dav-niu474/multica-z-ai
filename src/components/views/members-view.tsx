'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Plus,
  User,
  Trash2,
  Shield,
  Crown,
  Users,
  Mail,
  Calendar,
  MoreVertical,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MemberWithUser, MemberRole, User } from '@/types'
import { useWorkspace } from '@/hooks/use-workspace'
import { useTranslation } from '@/lib/i18n'

// ---- Role Config ----
const ROLE_CONFIG: Record<MemberRole, {
  label: string
  color: string
  icon: React.ReactNode
}> = {
  owner: {
    label: 'owner',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200',
    icon: <Crown className="size-3" />,
  },
  admin: {
    label: 'admin',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
    icon: <Shield className="size-3" />,
  },
  member: {
    label: 'member',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: <User className="size-3" />,
  },
}

// ---- Avatar helper ----
function getAvatarColor(name: string) {
  const colors = [
    'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// ---- Main Component ----
export default function MembersView() {
  const { workspaceId } = useWorkspace()
  const { t } = useTranslation()
  const [members, setMembers] = useState<MemberWithUser[]>([])
  const [loading, setLoading] = useState(true)

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<MemberRole>('member')
  const [inviting, setInviting] = useState(false)

  // Remove confirmation
  const [removeTarget, setRemoveTarget] = useState<MemberWithUser | null>(null)
  const [removing, setRemoving] = useState(false)

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/members?workspaceId=${workspaceId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchMembers().finally(() => setLoading(false))
  }, [fetchMembers])

  // Find current user (owner) — first owner in list
  const ownerMember = members.find((m) => m.role === 'owner')
  const isOwner = true // Simplified: assume owner access

  // Invite handler
  const handleInvite = async () => {
    if (!inviteEmail || !workspaceId) return
    setInviting(true)
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId,
        }),
      })
      if (res.ok) {
        setInviteOpen(false)
        setInviteEmail('')
        setInviteRole('member')
        await fetchMembers()
      }
    } catch (err) {
      console.error('Failed to invite member:', err)
    } finally {
      setInviting(false)
    }
  }

  // Remove handler
  const handleRemove = async () => {
    if (!removeTarget || !workspaceId) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/members/${removeTarget.id}?workspaceId=${workspaceId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id))
      }
    } catch (err) {
      console.error('Failed to remove member:', err)
    } finally {
      setRemoving(false)
      setRemoveTarget(null)
    }
  }

  // Change role handler
  const handleChangeRole = async (member: MemberWithUser, newRole: MemberRole) => {
    if (!workspaceId) return
    try {
      const res = await fetch(`/api/members/${member.id}?workspaceId=${workspaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
        )
      }
    } catch (err) {
      console.error('Failed to change role:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-medium">{t.members.title}</h1>
          <p className="text-sm text-muted-foreground">{t.members.subtitle}</p>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Plus className="size-4 mr-1.5" />
            {t.members.inviteMember}
          </Button>
        )}
      </div>

      {/* Members count */}
      {!loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          <span>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
            <Users className="size-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{t.members.noMembers}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.members.noMembersDesc}</p>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="size-4 mr-1" />
                {t.members.inviteMember}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y overflow-hidden">
          {members.map((member) => {
            const user = member.user
            if (!user) return null
            const roleConfig = ROLE_CONFIG[member.role]
            const isSelf = member.userId === ownerMember?.userId

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="size-10 shrink-0">
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )}
                  <AvatarFallback className={`text-sm font-medium text-white ${getAvatarColor(user.name)}`}>
                    {user.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {user.name}
                    </p>
                    {isSelf && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" />
                      {user.email}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" />
                      {formatDistanceToNow(new Date(member.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Role badge + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    className={`text-xs gap-1 ${roleConfig.color}`}
                  >
                    {roleConfig.icon}
                    {t.members[roleConfig.label as keyof typeof t.members]}
                  </Badge>

                  {/* Actions dropdown (not for self on owner) */}
                  {isOwner && !isSelf && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member, 'admin')}
                          disabled={member.role === 'admin'}
                        >
                          <Shield className="size-4 mr-2" />
                          {t.members.admin}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleChangeRole(member, 'member')}
                          disabled={member.role === 'member'}
                        >
                          <User className="size-4 mr-2" />
                          {t.members.member}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setRemoveTarget(member)}
                        >
                          <Trash2 className="size-4 mr-2" />
                          {t.members.removeMember}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { if (!open) { setInviteOpen(false); setInviteEmail('') } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.members.inviteMemberTitle}</DialogTitle>
            <DialogDescription>{t.members.inviteMemberDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.members.email} *</label>
              <Input
                type="email"
                placeholder={t.members.emailPlaceholder}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.members.role}</label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as MemberRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t.members.member}</SelectItem>
                  <SelectItem value="admin">{t.members.admin}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInviteOpen(false); setInviteEmail('') }}>
              {t.common.cancel}
            </Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || inviting}>
              {inviting ? t.common.saving : t.members.sendInvite}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <Dialog open={!!removeTarget} onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.members.removeMember}</DialogTitle>
            <DialogDescription>
              {t.members.removeMemberDesc.replace('{name}', removeTarget?.user?.name || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removing}>
              {removing ? t.common.saving : t.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
