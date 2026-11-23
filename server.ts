import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data', 'museums');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
}

async function startServer() {
  ensureDataDir();

  const app = express();
  app.use(express.json({ limit: '35mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/museums', (req, res) => {
    try {
      const payload = req.body as Record<string, unknown>;
      if (!payload || !Array.isArray(payload.artworks) || payload.artworks.length === 0) {
        res.status(400).json({ error: 'Kamida 1 ta surat yoki video bo‘lishi kerak' });
        return;
      }

      const id =
        typeof payload.id === 'string' && sanitizeId(payload.id).length >= 3
          ? sanitizeId(payload.id)
          : `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      const record = {
        ...payload,
        id,
        createdAt: typeof payload.createdAt === 'number' ? payload.createdAt : Date.now(),
      };

      const filePath = path.join(DATA_DIR, `${id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(record), 'utf8');
      res.json({ id });
    } catch (err) {
      console.error('Failed to save museum:', err);
      res.status(500).json({ error: 'Muzeyni saqlashda xatolik' });
    }
  });

  app.get('/api/museums/:id', (req, res) => {
    const id = sanitizeId(req.params.id);
    if (!id) {
      res.status(400).json({ error: 'Noto‘g‘ri ID' });
      return;
    }

    const filePath = path.join(DATA_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Muzey topilmadi' });
      return;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      res.type('application/json').send(raw);
    } catch {
      res.status(500).json({ error: 'O‘qishda xatolik' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Muzeycha.uz server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
