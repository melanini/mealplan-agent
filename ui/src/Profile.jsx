import { useState, useEffect } from 'react';
import './Profile.css';

const PROFILE_URL = 'http://localhost:3000';
const LOGGER_URL = 'http://localhost:3004';

function Profile({ userId, addLog, appLogs = [] }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemLogs, setSystemLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'logs'
  const [logFilter, setLogFilter] = useState('all'); // 'all', 'app', 'system'

  // Form state
  const [diet, setDiet] = useState('');
  const [intolerances, setIntolerances] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [servings, setServings] = useState('2');
  const [maxCookMins, setMaxCookMins] = useState('30');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generateDay, setGenerateDay] = useState('Sunday');

  const allergies = ['Gluten', 'Peanut', 'Tree Nut', 'Soy', 'Sesame', 'Mustard', 'Sulfite', 'Nightshade', 'Fish & Seafood'];
  const dislikeOptions = ['Avocado', 'Beets', 'Bell Peppers', 'Brussels Sprouts', 'Cauliflower', 'Eggplant', 'Mushrooms', 'Olives', 'Quinoa', 'Tofu', 'Turnips', 'Fish & Seafood'];

  useEffect(() => {
    loadProfile();
    loadLogs();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    addLog('Loading profile settings...');

    try {
      const response = await fetch(`${PROFILE_URL}/profile/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);

      // Populate form fields
      if (data.preferences) {
        setDiet(data.preferences.dietary?.[0] || '');
        setIntolerances(data.preferences.avoidIngredients || []);
        setDislikes(data.preferences.dislikes || []);
        setServings(data.preferences.servings?.toString() || '2');
        setMaxCookMins(data.preferences.maxCookMins?.toString() || '30');
        setAutoGenerate(data.preferences.autoGenerate || false);
        setGenerateDay(data.preferences.generateDay || 'Sunday');
      }

      addLog('Profile loaded successfully', 'success');
    } catch (err) {
      addLog(`Error loading profile: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch(`${LOGGER_URL}/logs?limit=100`);
      if (response.ok) {
        const data = await response.json();
        setSystemLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  const getCombinedLogs = () => {
    const combined = [];

    // Add app logs with source identifier
    appLogs.forEach(log => {
      combined.push({
        ...log,
        source: 'app',
        level: log.type || 'info'
      });
    });

    // Add system logs with source identifier
    systemLogs.forEach(log => {
      combined.push({
        ...log,
        source: 'system'
      });
    });

    // Sort by timestamp (most recent first)
    combined.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    // Filter based on selected filter
    if (logFilter === 'app') {
      return combined.filter(log => log.source === 'app');
    }
    if (logFilter === 'system') {
      return combined.filter(log => log.source === 'system');
    }
    return combined;
  };

  const saveProfile = async () => {
    setSaving(true);
    addLog('Saving profile settings...');

    try {
      const preferences = {
        dietary: diet ? [diet.toLowerCase()] : [],
        avoidIngredients: intolerances.map(i => i.toLowerCase()),
        dislikes: dislikes.map(d => d.toLowerCase()),
        servings: parseInt(servings),
        maxCookMins: parseInt(maxCookMins),
        autoGenerate,
        generateDay
      };

      const response = await fetch(`${PROFILE_URL}/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      setProfile(data);
      addLog('Profile saved successfully! ✅', 'success');
    } catch (err) {
      addLog(`Error saving profile: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleIntolerance = (item) => {
    setIntolerances(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleDislike = (item) => {
    setDislikes(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !intolerances.includes(customAllergy.trim())) {
      setIntolerances(prev => [...prev, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const addCustomDislike = () => {
    if (customDislike.trim() && !dislikes.includes(customDislike.trim())) {
      setDislikes(prev => [...prev, customDislike.trim()]);
      setCustomDislike('');
    }
  };

  const removeIntolerance = (item) => {
    setIntolerances(prev => prev.filter(i => i !== item));
  };

  const removeDislike = (item) => {
    setDislikes(prev => prev.filter(i => i !== item));
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>👤 Profile Settings</h1>
        <p className="profile-subtitle">User: {userId}</p>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button
          className={`profile-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Activity Logs
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="profile-content">
          <div className="settings-section">
            <h2>🍽️ Meal Plan Preferences</h2>
            
            <div className="setting-group">
              <label>
                Dietary Style:
                <select value={diet} onChange={(e) => setDiet(e.target.value)}>
                  <option value="">Any</option>
                  <option value="Classic">Classic</option>
                  <option value="Low Carb">Low Carb</option>
                  <option value="Keto">Keto</option>
                  <option value="Flexitarian">Flexitarian</option>
                  <option value="Paleo">Paleo</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Pescetarian">Pescetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </label>

              <label>
                Servings per meal:
                <select value={servings} onChange={(e) => setServings(e.target.value)}>
                  <option value="1">1 serving</option>
                  <option value="2">2 servings</option>
                  <option value="4">4 servings</option>
                  <option value="6">6 servings</option>
                </select>
              </label>

              <label>
                Max cook time (minutes):
                <input
                  type="number"
                  value={maxCookMins}
                  onChange={(e) => setMaxCookMins(e.target.value)}
                  min="10"
                  max="120"
                  step="5"
                />
              </label>
            </div>

            <div className="multi-select">
              <h3>🚫 Allergies & Intolerances</h3>
              <div className="pill-container">
                {allergies.map(allergy => (
                  <button
                    key={allergy}
                    className={`pill ${intolerances.includes(allergy) ? 'selected' : ''}`}
                    onClick={() => toggleIntolerance(allergy)}
                  >
                    {allergy}
                  </button>
                ))}
              </div>
              <div className="custom-input">
                <input
                  type="text"
                  placeholder="Add custom allergy..."
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomAllergy()}
                />
                <button onClick={addCustomAllergy} className="btn-add">Add</button>
              </div>
              {intolerances.length > 0 && (
                <div className="selected-items">
                  <strong>Selected:</strong>
                  {intolerances.map(item => (
                    <span key={item} className="selected-tag">
                      {item}
                      <button onClick={() => removeIntolerance(item)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="multi-select">
              <h3>👎 Food Dislikes</h3>
              <div className="pill-container">
                {dislikeOptions.map(item => (
                  <button
                    key={item}
                    className={`pill ${dislikes.includes(item) ? 'selected' : ''}`}
                    onClick={() => toggleDislike(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="custom-input">
                <input
                  type="text"
                  placeholder="Add custom dislike..."
                  value={customDislike}
                  onChange={(e) => setCustomDislike(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomDislike()}
                />
                <button onClick={addCustomDislike} className="btn-add">Add</button>
              </div>
              {dislikes.length > 0 && (
                <div className="selected-items">
                  <strong>Selected:</strong>
                  {dislikes.map(item => (
                    <span key={item} className="selected-tag">
                      {item}
                      <button onClick={() => removeDislike(item)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="settings-section">
            <h2>📅 Automatic Plan Generation</h2>
            <div className="auto-generate-section">
              <div className="toggle-container">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={autoGenerate}
                    onChange={(e) => setAutoGenerate(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {autoGenerate ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
                <p className="toggle-description">
                  Automatically generate a new meal plan every week with these settings
                </p>
              </div>

              {autoGenerate && (
                <div className="setting-group">
                  <label>
                    Generate new plan every:
                    <select value={generateDay} onChange={(e) => setGenerateDay(e.target.value)}>
                      <option value="Sunday">Sunday</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </label>
                  <div className="info-box">
                    <span className="info-icon">ℹ️</span>
                    <p>A new meal plan will be automatically generated every {generateDay} using your saved preferences.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="save-section">
            <button
              className="btn-save"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="profile-content">
          <div className="logs-section">
            <div className="logs-header">
              <div className="logs-title-group">
                <h2>📋 Activity Logs</h2>
                <div className="log-filters">
                  <button 
                    className={`filter-btn ${logFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setLogFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-btn ${logFilter === 'app' ? 'active' : ''}`}
                    onClick={() => setLogFilter('app')}
                  >
                    App ({appLogs.length})
                  </button>
                  <button 
                    className={`filter-btn ${logFilter === 'system' ? 'active' : ''}`}
                    onClick={() => setLogFilter('system')}
                  >
                    System ({systemLogs.length})
                  </button>
                </div>
              </div>
              <button onClick={loadLogs} className="btn-refresh">
                🔄 Refresh System Logs
              </button>
            </div>
            <div className="logs-list">
              {getCombinedLogs().length === 0 ? (
                <div className="logs-empty">
                  <p>No activity logs yet. Generate a plan to see activity.</p>
                </div>
              ) : (
                getCombinedLogs().map((log, idx) => (
                  <div key={idx} className={`log-item log-${log.level}`}>
                    <span className="log-timestamp">
                      {log.timestamp ? 
                        (typeof log.timestamp === 'string' && log.timestamp.includes('T') ? 
                          new Date(log.timestamp).toLocaleString() : 
                          log.timestamp) : 
                        'N/A'}
                    </span>
                    <span className={`log-source log-source-${log.source}`}>
                      {log.source === 'app' ? '🖥️ APP' : '⚙️ SYSTEM'}
                    </span>
                    <span className={`log-level log-level-${log.level}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;

