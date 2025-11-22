const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const logsDir = path.resolve(__dirname, '../../data/logs');
const logsFile = path.join(logsDir, 'events.json');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function loadLogs() {
  try {
    if (!fs.existsSync(logsFile)) {
      return [];
    }
    const content = fs.readFileSync(logsFile, 'utf8');
    return content ? JSON.parse(content) : [];
  } catch (err) {
    console.error('Failed to load logs:', err.message);
    return [];
  }
}

function saveLogs(logs) {
  fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));
}

app.post('/log', (req, res) => {
  const { level = 'info', message, context = {} } = req.body;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context
  };

  console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, context);

  const logs = loadLogs();
  logs.push(logEntry);
  
  if (logs.length > 1000) {
    logs.shift();
  }
  
  saveLogs(logs);

  res.json({ success: true, log: logEntry });
});

app.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const logs = loadLogs();
  
  res.json({
    total: logs.length,
    logs: logs.slice(-limit).reverse()
  });
});

app.delete('/logs', (req, res) => {
  saveLogs([]);
  console.log('Logs cleared');
  res.json({ success: true, message: 'All logs cleared' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`loggerTool listening on port ${PORT}`);
});

module.exports = app;

