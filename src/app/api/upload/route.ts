import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const UPLOADS_DIR = join(process.cwd(), 'uploads')

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/svg+xml',
  'image/webp',
])

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.slice(lastDot) : ''
}

function getMimeType(filename: string): string {
  const ext = getExtension(filename).toLowerCase()
  const mimeMap: Record<string, string> = {
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
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.rar': 'application/vnd.rar',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.wav': 'audio/wav',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.tsx': 'text/tsx',
    '.jsx': 'text/jsx',
    '.css': 'text/css',
    '.html': 'text/html',
    '.md': 'text/markdown',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.c': 'text/x-c',
    '.cpp': 'text/x-c++',
    '.h': 'text/x-c',
    '.hpp': 'text/x-c++',
    '.rs': 'text/x-rust',
    '.go': 'text/x-go',
    '.rb': 'text/x-ruby',
    '.php': 'text/x-php',
    '.sh': 'text/x-shellscript',
    '.yaml': 'text/yaml',
    '.yml': 'text/yaml',
    '.toml': 'text/toml',
    '.sql': 'application/sql',
    '.psd': 'image/vnd.adobe.photoshop',
    '.ai': 'application/illustrator',
    '.sketch': 'application/sketch',
    '.fig': 'application/x-figma',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

// POST /api/upload - Upload a file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const workspaceId = (formData.get('workspaceId') as string) || 'default'
    const issueId = formData.get('issueId') as string | null
    const commentId = formData.get('commentId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 })
    }

    const fileId = uuidv4()
    const ext = getExtension(file.name)
    const fileName = `${fileId}${ext}`
    const workspaceDir = join(UPLOADS_DIR, workspaceId)

    // Ensure workspace directory exists
    if (!existsSync(workspaceDir)) {
      await mkdir(workspaceDir, { recursive: true })
    }

    const filePath = join(workspaceDir, fileName)

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const mimeType = file.type || getMimeType(file.name)
    const now = new Date().toISOString()

    const attachment = {
      id: fileId,
      name: file.name,
      url: `/api/upload/${fileId}`,
      size: file.size,
      mimeType,
      createdAt: now,
      workspaceId,
      issueId: issueId || undefined,
      commentId: commentId || undefined,
    }

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
