const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = process.env.PORT || 3000;

let nextId = 1;
const transactions = [];

function resetData() {
  transactions.length = 0;
  nextId = 1;
}

function collectBody(req, cb) {
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => {
    try {
      cb(data ? JSON.parse(data) : {});
    } catch {
      cb({});
    }
  });
}

function getMime(filePath) {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

function handler(req, res) {
  const parsed = url.parse(req.url, true);

  // Serve static files
  if (!parsed.pathname.startsWith('/api')) {
    const file = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1);
    const filePath = path.join(__dirname, 'public', file);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': getMime(filePath) });
        res.end(data);
      }
    });
    return;
  }

  // API routes
  if (req.method === 'GET' && parsed.pathname === '/api/transactions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(transactions));
    return;
  }

  if (req.method === 'POST' && parsed.pathname === '/api/transactions') {
    collectBody(req, body => {
      const { description = '', amount = 0 } = body;
      const tx = {
        id: nextId++,
        description,
        amount: Number(amount) || 0,
        date: new Date().toISOString(),
      };
      transactions.push(tx);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tx));
    });
    return;
  }

  const idMatch = parsed.pathname.match(/^\/api\/transactions\/(\d+)$/);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const idx = transactions.findIndex(t => t.id === id);

    if (req.method === 'GET') {
      const tx = transactions[idx];
      if (!tx) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tx));
      }
      return;
    }

    if (req.method === 'PUT') {
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      collectBody(req, body => {
        if (body.description !== undefined) transactions[idx].description = body.description;
        if (body.amount !== undefined) transactions[idx].amount = Number(body.amount);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(transactions[idx]));
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (idx === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }
      transactions.splice(idx, 1);
      res.writeHead(204);
      res.end();
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

const app = http.createServer(handler);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}

module.exports = { app, resetData };
