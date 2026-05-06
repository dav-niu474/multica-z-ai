import { NextRequest, NextResponse } from 'next/server'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { readdir } from 'fs/promises'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
])

// Helper: find file across all workspace directories by id prefix
async function findFile(fileId: string): Promise<{ filePath: string; ext: string; mimeType: string } | null> {
  const workspaceDir = UPLOADS_DIR
  if (!existsSync(workspaceDir)) return null

  const workspaces = await readdir(workspaceDir, { withFileTypes: true })
  
  for (const ws of workspaces) {
    if (!ws.isDirectory()) continue
    
    const wsDir = join(workspaceDir, ws.name)
    const files = await readdir(wsDir)
    
    for (const file of files) {
      // File is stored as {uuid}{ext}, match by id prefix
      if (file.startsWith(fileId)) {
        const ext = file.slice(fileId.length)
        const mimeType = guessMimeType(ext)
        return {
          filePath: join(wsDir, file),
          ext,
          mimeType,
        }
      }
    }
  }
  
  return null
}

function guessMimeType(ext: string): string {
  const mimeMap: Record<string, string> = {
    '': 'application/octet-stream',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  }
  return mimeMap[ext.toLowerCase()] || 'application/octet-stream'
}

// GET /api/upload/[id] - Serve uploaded file
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate id format (should be a UUID)
    if (!id || id.includes('/') || id.includes('..')) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 })
    }

    const result = await findFile(id)
    if (!result) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const { filePath, mimeType } = result
    const fileBuffer = await readFile(filePath)
    
    const isImage = IMAGE_MIME_TYPES.has(mimeType)
    
    const headers = new Headers()
    headers.set('Content-Type', mimeType)
    headers.set('Content-Length', fileBuffer.length.toString())
    
    if (isImage) {
      headers.set('Content-Disposition', `inline; filename="${id}"`)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    } else {
      headers.set('Content-Disposition', `attachment; filename="${id}"`)
      headers.set('Cache-Control', 'public, max-age=86400')
    }

    return new NextResponse(fileBuffer, { headers })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 })
  }
}
