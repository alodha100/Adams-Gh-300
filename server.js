const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const topics = require('./topics');

const staticFiles = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 8192) {
        chunks.length = 0;
        reject({ status: 413, message: 'Registration request is too large.' });
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject({ status: 400, message: 'Send a valid JSON registration.' });
      }
    });
    request.on('error', () => {
      reject({ status: 400, message: 'Unable to read registration.' });
    });
  });
}

function createServer() {
  // Demo-only storage: registrations reset when the server restarts.
  const registrations = new Map();

  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy',
      "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");

    let pathname;
    try {
      pathname = new URL(request.url, 'http://localhost').pathname;
    } catch {
      return json(response, 400, { error: 'Invalid request URL.' });
    }
    if (pathname === '/api/topics' && request.method === 'GET') {
      return json(response, 200, topics.map((topic) => ({
        ...topic,
        capacity: 30,
        registrationCount: Array.from(registrations.values())
          .filter((registration) => registration.topicId === topic.id).length,
      })));
    }

    if (pathname === '/api/registrations' && request.method === 'POST') {
      if (request.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
        return json(response, 415, { error: 'Use application/json for registrations.' });
      }
      try {
        const data = await readJson(request);
        const name = typeof data?.name === 'string' ? data.name.trim() : '';
        const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
        const topic = topics.find((item) => item.id === data?.topicId);
        if (!name || name.length > 100 || email.length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !topic) {
          return json(response, 400, {
            error: 'Enter a name (up to 100 characters), a valid email, and an available topic.',
          });
        }
        const registration = { id: randomUUID(), name, email, topicId: topic.id };
        registrations.set(registration.id, registration);
        return json(response, 201, { registration, message: `You are registered for ${topic.title}.` });
      } catch (error) {
        return json(response, error.status || 500, {
          error: error.status ? error.message : 'Unable to register. Please try again.',
        });
      }
    }

    if (request.method === 'GET' && Object.hasOwn(staticFiles, pathname)) {
      const [filename, contentType] = staticFiles[pathname];
      try {
        const content = await readFile(path.join(__dirname, 'public', filename));
        response.writeHead(200, { 'Content-Type': contentType });
        return response.end(content);
      } catch {
        return json(response, 500, { error: 'Unable to load the page.' });
      }
    }
    return json(response, 404, { error: 'Not found.' });
  });
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, '0.0.0.0', () => {
    console.log(`Telstra training demo running on http://localhost:${port}`);
  });
}

module.exports = { createServer };
