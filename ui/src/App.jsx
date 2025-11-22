import { useState } from 'react';
import './App.css';
import PlanView from './PlanView';
import History from './History';
import Profile from './Profile';

const AGENT_URL = 'http://localhost:4000';

function App() {
  const [view, setView] = useState('home'); // 'home', 'plan', 'history', 'profile'
  const [userId, setUserId] = useState('melani-123');
  const [diet, setDiet] = useState('');
  const [intolerances, setIntolerances] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [servings, setServings] = useState('2');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [notification, setNotification] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    
    // Show notification for success and error messages
    if (type === 'success' || type === 'error') {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const allergies = ['Gluten', 'Peanut', 'Tree Nut', 'Soy', 'Sesame', 'Mustard', 'Sulfite', 'Nightshade', 'Fish & Seafood'];
  const dislikeOptions = ['Avocado', 'Beets', 'Bell Peppers', 'Brussels Sprouts', 'Cauliflower', 'Eggplant', 'Mushrooms', 'Olives', 'Quinoa', 'Tofu', 'Turnips', 'Fish & Seafood'];

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

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    addLog(`Generating plan for user: ${userId}`);

    try {
      // First, update user profile with preferences
      if (diet || intolerances.length > 0 || dislikes.length > 0) {
        addLog('Updating user profile with preferences...');
        await fetch(`http://localhost:3000/profile/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              dietary: diet ? [diet.toLowerCase()] : [],
              avoidIngredients: [...intolerances.map(i => i.toLowerCase()), ...dislikes.map(d => d.toLowerCase())],
              maxCookMins: 30
            }
          })
        });
        addLog('Profile updated successfully', 'success');
      }

      addLog('Calling agent to generate weekly plan...');
      const response = await fetch(`${AGENT_URL}/plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weekStart: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate plan: ${response.statusText}`);
      }

      const data = await response.json();
      setPlan(data.plan);
      addLog(`Plan generated successfully: ${data.planId}`, 'success');
      addLog(`Selected ${data.plan.weekPlan.length} recipes`);
    } catch (err) {
      setError(err.message);
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPlan = (historicalPlan) => {
    setPlan(historicalPlan);
    setView('plan');
  };

  const renderView = () => {
    if (view === 'profile') {
      return <Profile userId={userId} addLog={addLog} appLogs={logs} />;
    }

    if (view === 'history') {
      return <History userId={userId} onViewPlan={handleViewPlan} addLog={addLog} />;
    }

    if (plan || view === 'plan') {
      return <PlanView plan={plan} setPlan={setPlan} logs={logs} addLog={addLog} />;
    }

    // Home view - meal plan generator
    return (
      <div className="form-section">
          <label>
            User ID:
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </label>

          <label>
            Diet:
            <select value={diet} onChange={(e) => setDiet(e.target.value)}>
              <option value="">Select diet...</option>
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
            Servings:
            <select value={servings} onChange={(e) => setServings(e.target.value)}>
              <option value="2">2 servings</option>
              <option value="4">4 servings</option>
              <option value="6">6 servings</option>
            </select>
          </label>

          <div className="multi-select">
            <h3>Any allergies?</h3>
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
            <h3>How about dislikes?</h3>
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

          {error && <div className="error">{error}</div>}

          <button
            className="btn-primary"
            onClick={generatePlan}
            disabled={loading || !userId}
          >
            {loading ? 'Generating...' : 'Generate Week Plan'}
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">🍽️ Mealprep Agent</div>
        <div className="nav-links">
          <button 
            className={`nav-link ${view === 'home' && !plan ? 'active' : ''}`}
            onClick={() => {
              setView('home');
              setPlan(null);
            }}
          >
            🏠 Home
          </button>
          <button 
            className={`nav-link ${view === 'profile' ? 'active' : ''}`}
            onClick={() => setView('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`nav-link ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            📅 History
          </button>
        </div>
      </nav>

      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? '✅ ' : '❌ '}
          {notification.message}
        </div>
      )}

      <div className="app-content">
        {renderView()}
      </div>
    </div>
  );
}

export default App;
