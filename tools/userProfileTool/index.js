const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
const dbPath = path.resolve(__dirname, 'db.json');

function loadDb() {
  try {
    const contents = fs.readFileSync(dbPath, 'utf8').trim();
    return contents ? JSON.parse(contents) : {};
  } catch (err) {
    if (err.code === 'ENOENT') {
      fs.writeFileSync(dbPath, '{}\n');
      return {};
    }
    throw err;
  }
}

function persistDb(db) {
  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);
}

const profiles = loadDb();
const defaultProfileFor = (userId) => ({
  id: userId,
  name: '',
  email: '',
  preferences: {}
});

app.use(express.json());

function ensureBodyObject(req, res) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    res.status(400).json({ error: 'Request body must be an object with profile data.' });
    return false;
  }
  return true;
}

app.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const profile = profiles[userId];
  res.json(profile ?? defaultProfileFor(userId));
});

app.post('/profile/:userId', (req, res) => {
  if (!ensureBodyObject(req, res)) return;
  const { userId } = req.params;
  const payload = { ...req.body, id: userId };
  profiles[userId] = payload;
  persistDb(profiles);
  res.status(201).json(payload);
});

app.patch('/profile/:userId', (req, res) => {
  if (!ensureBodyObject(req, res)) return;
  const { userId } = req.params;
  const existing = profiles[userId] ?? defaultProfileFor(userId);
  const updated = { ...existing, ...req.body, id: userId };
  profiles[userId] = updated;
  persistDb(profiles);
  res.json(updated);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`userProfileTool listening on port ${PORT}`);
});

module.exports = app;

