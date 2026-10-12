import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

export async function handle(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader || undefined);

    if (!token) {
      return new Response(superjson.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return new Response(superjson.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string || 'other';

    if (!file) {
      return new Response(superjson.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file type
    const ext = path.extname(file.name).toLowerCase();
    const allowedTypes: Record<string, string> = {
      '.pdf': 'pdf',
      '.txt': 'txt',
      '.md': 'md',
    };

    if (!allowedTypes[ext]) {
      return new Response(superjson.stringify({ error: 'Unsupported file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save file
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path.join(uploadsDir, `${timestamp}_${safeFileName}`);

    const buffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    // Create document record
    const document = await db.insertInto('documents')
      .values({
        organizationId: payload.organizationId,
        name: file.name,
        filePath,
        fileType: allowedTypes[ext],
        category: category as any,
        status: 'processing',
        chunkCount: 0,
        createdBy: payload.userId,
      })
      .returning(['id', 'name', 'fileType', 'category', 'status', 'chunkCount', 'createdAt'])
      .executeTakeFirstOrThrow();

    // TODO: Queue background job to:
    // 1. Extract text from PDF
    // 2. Chunk the text
    // 3. Generate embeddings
    // 4. Store chunks in document_chunks table
    // 5. Update document status to 'ready'

    // For now, simulate processing by marking as ready after a delay
    setTimeout(async () => {
      try {
        // Read file content (simplified - just for text files)
        let content = '';
        if (allowedTypes[ext] === 'txt' || allowedTypes[ext] === 'md') {
          content = await fs.readFile(filePath, 'utf-8');
        } else {
          // For PDF, we'd use pdf-parse here
          content = `[PDF content from ${file.name}]`;
        }

        // Simple chunking (split by paragraphs)
        const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 50);

        // Insert chunks
        for (let i = 0; i < chunks.length; i++) {
          await db.insertInto('documentChunks')
            .values({
              documentId: document.id,
              content: chunks[i],
              chunkIndex: i,
              embedding: null, // Would generate with OpenAI here
              metadata: JSON.stringify({ page: Math.floor(i / 5) + 1 }),
            })
            .execute();
        }

        // Update document status
        await db.updateTable('documents')
          .set({
            status: 'ready',
            chunkCount: chunks.length,
          })
          .where('id', '=', document.id)
          .execute();
      } catch (err) {
        console.error('Failed to process document:', err);
        await db.updateTable('documents')
          .set({ status: 'failed' })
          .where('id', '=', document.id)
          .execute();
      }
    }, 2000);

    return new Response(superjson.stringify({ document }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload document';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
