import "./loadEnv.js";
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { initDb } from './helpers/db.js';
import { wsHub } from './helpers/websocket.js';

// Initialize database before starting server
await initDb();

const app = new Hono();

// Enable CORS for development
app.use('/*', cors());

// Auth endpoints
app.post('/_api/auth/login', async c => {
  try {
    const { handle } = await import("./endpoints/auth/login_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/auth/register', async c => {
  try {
    const { handle } = await import("./endpoints/auth/register_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/auth/me', async c => {
  try {
    const { handle } = await import("./endpoints/auth/me_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Facilities endpoints
app.get('/_api/facilities', async c => {
  try {
    const { handle } = await import("./endpoints/facilities/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});


// CRM endpoints (Inflow customer database)
for (const [route, file] of [['accounts', 'accounts_GET'], ['account', 'account_GET'], ['summary', 'summary_GET']] as const) {
  app.get(`/_api/crm/${route}`, async c => {
    try {
      const { handle } = await import(`./endpoints/crm/${file}.js`);
      return await handle(c.req.raw);
    } catch (e) {
      console.error(e);
      return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
    }
  });
}

// Sensors endpoints
app.get('/_api/sensors', async c => {
  try {
    const { handle } = await import("./endpoints/sensors/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/sensors', async c => {
  try {
    const { handle } = await import("./endpoints/sensors/create_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Readings endpoints
app.post('/_api/readings/ingest', async c => {
  try {
    const { handle } = await import("./endpoints/readings/ingest_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/readings/latest', async c => {
  try {
    const { handle } = await import("./endpoints/readings/latest_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/readings/historical', async c => {
  try {
    const { handle } = await import("./endpoints/readings/historical_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/readings/test', async c => {
  try {
    const { handle } = await import("./endpoints/readings/test_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Alerts endpoints
app.get('/_api/alerts', async c => {
  try {
    const { handle } = await import("./endpoints/alerts/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/alerts/rules', async c => {
  try {
    const { handle } = await import("./endpoints/alerts/rules_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/alerts/rules', async c => {
  try {
    const { handle } = await import("./endpoints/alerts/rules_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/alerts/:id/acknowledge', async c => {
  try {
    const { handle } = await import("./endpoints/alerts/acknowledge_POST.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Diagrams endpoints
app.get('/_api/diagrams', async c => {
  try {
    const { handle } = await import("./endpoints/diagrams/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/diagrams', async c => {
  try {
    const { handle } = await import("./endpoints/diagrams/create_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/diagrams/:id', async c => {
  try {
    const { handle } = await import("./endpoints/diagrams/get_GET.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.patch('/_api/diagrams/:id', async c => {
  try {
    const { handle } = await import("./endpoints/diagrams/update_PATCH.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Documents (Knowledge Base) endpoints
app.get('/_api/documents', async c => {
  try {
    const { handle } = await import("./endpoints/documents/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/documents/upload', async c => {
  try {
    const { handle } = await import("./endpoints/documents/upload_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.delete('/_api/documents/:id', async c => {
  try {
    const { handle } = await import("./endpoints/documents/delete_DELETE.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Chat endpoints
app.get('/_api/chat/sessions', async c => {
  try {
    const { handle } = await import("./endpoints/chat/sessions_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/chat/sessions', async c => {
  try {
    const { handle } = await import("./endpoints/chat/sessions_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.get('/_api/chat/sessions/:id/messages', async c => {
  try {
    const { handle } = await import("./endpoints/chat/messages_GET.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/chat/message', async c => {
  try {
    const { handle } = await import("./endpoints/chat/message_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// CAGI data sheet endpoints
app.get('/_api/cagi', async c => {
  try {
    const { handle } = await import("./endpoints/cagi/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/cagi', async c => {
  try {
    const { handle } = await import("./endpoints/cagi/create_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/cagi/upload', async c => {
  try {
    const { handle } = await import("./endpoints/cagi/upload_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.delete('/_api/cagi/:id', async c => {
  try {
    const { handle } = await import("./endpoints/cagi/delete_DELETE.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Production data endpoints
app.get('/_api/production', async c => {
  try {
    const { handle } = await import("./endpoints/production/list_GET.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.post('/_api/production', async c => {
  try {
    const { handle } = await import("./endpoints/production/create_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

app.delete('/_api/production/:id', async c => {
  try {
    const { handle } = await import("./endpoints/production/delete_DELETE.js");
    return await handle(c.req.raw, c.req.param('id'));
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Contact form (existing)
app.post('/_api/contact/submit', async c => {
  try {
    const { handle } = await import("./endpoints/contact/submit_POST.js");
    return await handle(c.req.raw);
  } catch (e) {
    console.error(e);
    return c.json({ error: "Error loading endpoint: " + (e as Error).message }, 500);
  }
});

// Skip WebSocket path - let ws library handle it
app.use('/ws', async (c, next) => {
  // Return early so ws library can handle the upgrade
  return next();
});

// Static files
app.use("/*", serveStatic({ root: "./static" }));
app.use('/*', serveStatic({ root: './dist' }));

// SPA fallback
app.get("*", async (c, next) => {
  const p = c.req.path;
  if (p.startsWith("/_api") || p === "/ws") {
    return next();
  }
  return serveStatic({ path: "./dist/index.html" })(c, next);
});

const port = parseInt(process.env.PORT || '3333', 10);

// Create HTTP server manually for WebSocket support
import { createServer } from 'http';
import { getRequestListener } from '@hono/node-server';

const httpServer = createServer(getRequestListener(app.fetch));

// Initialize WebSocket server before starting HTTP server
wsHub.initialize(httpServer);

httpServer.listen(port, () => {
  console.log(`Running at http://localhost:${port}`);
  console.log(`WebSocket available at ws://localhost:${port}/ws`);
});
