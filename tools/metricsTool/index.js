const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const metricsDir = path.resolve(__dirname, '../../data/metrics');
const metricsFile = path.join(metricsDir, 'counters.json');

if (!fs.existsSync(metricsDir)) {
  fs.mkdirSync(metricsDir, { recursive: true });
}

function loadMetrics() {
  try {
    if (!fs.existsSync(metricsFile)) {
      return {};
    }
    const content = fs.readFileSync(metricsFile, 'utf8');
    return content ? JSON.parse(content) : {};
  } catch (err) {
    console.error('Failed to load metrics:', err.message);
    return {};
  }
}

function saveMetrics(metrics) {
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
}

app.post('/metrics/increment', (req, res) => {
  const { metric, value = 1 } = req.body;

  if (!metric) {
    return res.status(400).json({ error: 'metric name is required' });
  }

  const metrics = loadMetrics();
  
  if (!metrics[metric]) {
    metrics[metric] = {
      count: 0,
      lastUpdated: null
    };
  }

  metrics[metric].count += value;
  metrics[metric].lastUpdated = new Date().toISOString();

  saveMetrics(metrics);

  console.log(`[${metrics[metric].lastUpdated}] METRIC ${metric}: ${metrics[metric].count} (+${value})`);

  res.json({
    success: true,
    metric,
    count: metrics[metric].count
  });
});

app.get('/metrics', (req, res) => {
  const metrics = loadMetrics();
  res.json(metrics);
});

app.delete('/metrics', (req, res) => {
  saveMetrics({});
  console.log('Metrics cleared');
  res.json({ success: true, message: 'All metrics cleared' });
});

app.delete('/metrics/:metricName', (req, res) => {
  const { metricName } = req.params;
  const metrics = loadMetrics();
  
  if (metrics[metricName]) {
    delete metrics[metricName];
    saveMetrics(metrics);
    console.log(`Metric ${metricName} deleted`);
    res.json({ success: true, message: `Metric ${metricName} deleted` });
  } else {
    res.status(404).json({ error: 'Metric not found' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`metricsTool listening on port ${PORT}`);
});

module.exports = app;

