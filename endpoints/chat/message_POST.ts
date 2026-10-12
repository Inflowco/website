import { z } from 'zod';
import superjson from 'superjson';
import { db } from '../../helpers/db';
import { verifyToken, extractTokenFromHeader } from '../../helpers/auth';

const schema = z.object({
  sessionId: z.number(),
  message: z.string().min(1),
});

// Simple RAG implementation
// In production, you'd use OpenAI embeddings + vector similarity search
async function findRelevantChunks(query: string, organizationId: number, limit = 3) {
  // Simple keyword search (in production, use vector similarity)
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  if (keywords.length === 0) {
    return [];
  }

  // Search chunks that contain any keywords
  const chunks = await db.selectFrom('documentChunks')
    .innerJoin('documents', 'documents.id', 'documentChunks.documentId')
    .select([
      'documentChunks.id as chunkId',
      'documentChunks.content',
      'documents.name as documentName',
    ])
    .where('documents.organizationId', '=', organizationId)
    .where('documents.status', '=', 'ready')
    .limit(limit * 3) // Get more than needed for filtering
    .execute();

  // Filter and rank by keyword matches
  const ranked = chunks
    .map(chunk => {
      const contentLower = chunk.content.toLowerCase();
      const matches = keywords.filter(k => contentLower.includes(k)).length;
      return { ...chunk, score: matches };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

// Generate response (mock - in production, use OpenAI)
function generateResponse(query: string, context: string[]): string {
  if (context.length === 0) {
    return `I don't have specific information about "${query}" in the uploaded documents.

However, I can provide general guidance about compressed air systems. Could you:
1. Upload relevant documentation (PDFs, manuals) to the Knowledge Base
2. Ask a more specific question

For general compressed air questions, consider consulting:
- ISO 8573 (Compressed air quality standards)
- CAGI performance data sheets
- Your equipment manufacturer's documentation`;
  }

  // Mock response with context
  return `Based on the uploaded documents, here's what I found:

${context.map((c, i) => `${i + 1}. ${c.substring(0, 200)}...`).join('\n\n')}

This information comes from your organization's knowledge base. For more specific details, please refer to the source documents or ask a follow-up question.`;
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

    const text = await request.text();
    const json = superjson.parse(text);
    const data = schema.parse(json);

    // Verify session belongs to user
    const session = await db.selectFrom('chatSessions')
      .select('userId')
      .where('id', '=', data.sessionId)
      .executeTakeFirst();

    if (!session || session.userId !== payload.userId) {
      return new Response(superjson.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save user message
    await db.insertInto('chatMessages')
      .values({
        sessionId: data.sessionId,
        role: 'user',
        content: data.message,
      })
      .execute();

    // Find relevant document chunks (RAG)
    const relevantChunks = await findRelevantChunks(data.message, payload.organizationId);

    // Generate response
    const context = relevantChunks.map(c => c.content);
    const responseContent = generateResponse(data.message, context);

    // Prepare sources
    const sources = relevantChunks.map(c => ({
      documentName: c.documentName,
      chunkId: c.chunkId,
    }));

    // Save assistant response
    const response = await db.insertInto('chatMessages')
      .values({
        sessionId: data.sessionId,
        role: 'assistant',
        content: responseContent,
        sources: sources.length > 0 ? JSON.stringify(sources) : null,
      })
      .returning(['id', 'role', 'content', 'sources', 'createdAt'])
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({
      response: {
        ...response,
        sources,
      },
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return new Response(superjson.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
