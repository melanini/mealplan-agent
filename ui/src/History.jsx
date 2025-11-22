import { useState, useEffect } from 'react';
import './History.css';

const AGENT_URL = 'http://localhost:4000';

function History({ userId, onViewPlan, addLog }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    addLog('Fetching meal plan history...');

    try {
      const response = await fetch(`${AGENT_URL}/history/${userId}?limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistory(data.plans);
      addLog(`Loaded ${data.plans.length} past meal plans`, 'success');
    } catch (err) {
      setError(err.message);
      addLog(`Error loading history: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPlanDetails = async (planId) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
      return;
    }

    addLog(`Loading plan details: ${planId}`);

    try {
      const response = await fetch(`${AGENT_URL}/plan/${planId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load plan details');
      }

      const plan = await response.json();
      setExpandedPlan(planId);
      
      // Store the full plan for viewing
      const updatedHistory = history.map(h => 
        h.planId === planId ? { ...h, fullPlan: plan } : h
      );
      setHistory(updatedHistory);
      
      addLog('Plan details loaded', 'success');
    } catch (err) {
      addLog(`Error loading plan: ${err.message}`, 'error');
    }
  };

  const getRatingStars = (rating) => {
    if (!rating) return '☆☆☆☆☆';
    const filled = '★'.repeat(Math.floor(rating));
    const empty = '☆'.repeat(5 - Math.floor(rating));
    return filled + empty;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="history-loading">
          <div className="spinner"></div>
          <p>Loading your meal plan history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="history-error">
          <h2>⚠️ Error Loading History</h2>
          <p>{error}</p>
          <button onClick={fetchHistory} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-container">
        <div className="history-empty">
          <h2>📅 No Meal Plans Yet</h2>
          <p>Your meal plan history will appear here once you generate your first plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h1>📅 Meal Plan History</h1>
        <p className="history-subtitle">
          {history.length} plan{history.length !== 1 ? 's' : ''} • {userId}
        </p>
      </div>

      <div className="history-list">
        {history.map((plan) => {
          const isExpanded = expandedPlan === plan.planId;
          const fullPlan = plan.fullPlan;

          return (
            <div key={plan.planId} className={`history-card ${isExpanded ? 'expanded' : ''}`}>
              <div className="history-card-header" onClick={() => loadPlanDetails(plan.planId)}>
                <div className="history-card-title">
                  <h3>Week of {formatDate(plan.weekStart)}</h3>
                  <span className="history-time">{getTimeSince(plan.createdAt)}</span>
                </div>
                
                <div className="history-card-stats">
                  <div className="stat">
                    <span className="stat-icon">🍽️</span>
                    <span className="stat-value">{plan.recipeCount}</span>
                    <span className="stat-label">recipes</span>
                  </div>
                  
                  {plan.averageRating && (
                    <div className="stat">
                      <span className="stat-icon">⭐</span>
                      <span className="stat-value">{plan.averageRating}</span>
                      <span className="stat-label">avg rating</span>
                    </div>
                  )}
                  
                  {plan.feedbackCount > 0 && (
                    <div className="stat">
                      <span className="stat-icon">💬</span>
                      <span className="stat-value">{plan.feedbackCount}</span>
                      <span className="stat-label">feedback</span>
                    </div>
                  )}
                </div>

                <div className="expand-icon">
                  {isExpanded ? '▼' : '▶'}
                </div>
              </div>

              {isExpanded && fullPlan && (
                <div className="history-card-details">
                  <div className="plan-actions">
                    <button 
                      className="btn-view-plan"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPlan(fullPlan);
                      }}
                    >
                      📖 View Full Plan
                    </button>
                  </div>

                  <div className="meals-grid">
                    {fullPlan.weekPlan.map((dayPlan) => (
                      <div key={dayPlan.day} className="day-summary">
                        <h4>{dayPlan.day}</h4>
                        
                        <div className="meal-summary">
                          <span className="meal-type">🌤️ Lunch:</span>
                          <span className="meal-name">{dayPlan.lunch.title}</span>
                          {fullPlan.feedback?.[dayPlan.lunch.id]?.rating && (
                            <span className="meal-rating">
                              {getRatingStars(fullPlan.feedback[dayPlan.lunch.id].rating)}
                            </span>
                          )}
                        </div>

                        <div className="meal-summary">
                          <span className="meal-type">🌙 Dinner:</span>
                          <span className="meal-name">{dayPlan.dinner.title}</span>
                          {fullPlan.feedback?.[dayPlan.dinner.id]?.rating && (
                            <span className="meal-rating">
                              {getRatingStars(fullPlan.feedback[dayPlan.dinner.id].rating)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {fullPlan.replacements && fullPlan.replacements.length > 0 && (
                    <div className="replacements-summary">
                      <h4>🔄 Replacements ({fullPlan.replacements.length})</h4>
                      <ul>
                        {fullPlan.replacements.map((replacement, idx) => (
                          <li key={idx}>
                            {replacement.day} {replacement.mealType}: 
                            <span className="old-recipe">{replacement.oldRecipe.title}</span>
                            → 
                            <span className="new-recipe">{replacement.newRecipe.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default History;

