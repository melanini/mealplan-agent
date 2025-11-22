import { useState, useEffect } from 'react';
import './LogsPage.css';

const LOGGER_URL = 'http://localhost:3004';
const METRICS_URL = 'http://localhost:3003';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${LOGGER_URL}/logs?limit=200`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${METRICS_URL}/metrics`);
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Clear all logs?')) return;
    try {
      await fetch(`${LOGGER_URL}/logs`, { method: 'DELETE' });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const clearMetrics = async () => {
    if (!confirm('Reset all metrics?')) return;
    try {
      await fetch(`${METRICS_URL}/metrics`, { method: 'DELETE' });
      setMetrics({});
    } catch (err) {
      console.error('Failed to clear metrics:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchMetrics()]);
      setLoading(false);
    };

    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getLevelColor = (level) => {
    const colors = {
      error: '#f44336',
      warn: '#ff9800',
      warning: '#ff9800',
      info: '#2196f3',
      success: '#4caf50',
      debug: '#9e9e9e'
    };
    return colors[level?.toLowerCase()] || '#2196f3';
  };

  return (
    <div className="logs-page">
      <div className="logs-header">
        <h1>System Observability</h1>
        <div className="controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (3s)
          </label>
          <button onClick={() => { fetchLogs(); fetchMetrics(); }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="observability-grid">
        <div className="metrics-panel">
          <div className="panel-header">
            <h2>Metrics</h2>
            <button className="btn-small" onClick={clearMetrics}>Clear</button>
          </div>
          
          {loading ? (
            <div className="loading">Loading metrics...</div>
          ) : Object.keys(metrics).length === 0 ? (
            <div className="empty">No metrics recorded</div>
          ) : (
            <div className="metrics-grid">
              {Object.entries(metrics).map(([name, data]) => (
                <div key={name} className="metric-card">
                  <div className="metric-name">{name}</div>
                  <div className="metric-value">{data.count}</div>
                  <div className="metric-time">
                    {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="logs-panel-page">
          <div className="panel-header">
            <h2>Event Logs ({logs.length})</h2>
            <button className="btn-small" onClick={clearLogs}>Clear</button>
          </div>

          {loading ? (
            <div className="loading">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="empty">No logs recorded</div>
          ) : (
            <div className="logs-list">
              {logs.map((log, idx) => (
                <div key={idx} className="log-item">
                  <div 
                    className="log-level-indicator"
                    style={{ backgroundColor: getLevelColor(log.level) }}
                  />
                  <div className="log-content">
                    <div className="log-header-row">
                      <span className="log-level" style={{ color: getLevelColor(log.level) }}>
                        {log.level?.toUpperCase() || 'INFO'}
                      </span>
                      <span className="log-timestamp">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="log-message">{log.message}</div>
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className="log-context">
                        <pre>{JSON.stringify(log.context, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogsPage;

