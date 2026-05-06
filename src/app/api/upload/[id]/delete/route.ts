import { NextRequest, NextResponse } from 'next/server'
import { unlink, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

// Helper: find and delete file across all workspace directories by id prefix
async function findAndDelete(fileId: string): Promise<boolean> {
  const workspaceDir = UPLOADS_DIR
  if (!existsSync(workspaceDir)) return false

  const workspaces = await readdir(workspaceDir, { withFileTypes: true })
  
  for (const ws of workspaces) {
    if (!ws.isDirectory()) continue
    
    const wsDir = join(workspaceDir, ws.name)
    const files = await readdir(wsDir)
    
    for (const file of files) {
      if (file.startsWith(fileId)) {
        const filePath = join(wsDir, file)
        try {
          await unlink(filePath)
          return true
        } catch {
          return false
        }
      }
    }
  }
  
  return false
}

// DELETE /api/upload/[id]/delete - Delete uploaded file
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate id format
    if (!id || id.includes('/') || id.includes('..')) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 })
    }

    const deleted = await findAndDelete(id)
    if (!deleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}
