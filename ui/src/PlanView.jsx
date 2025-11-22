import { useState } from 'react';
import './PlanView.css';

const AGENT_URL = 'http://localhost:4000';

function PlanView({ plan, setPlan, logs, addLog }) {
  const [showFeedback, setShowFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState(null);
  const [recipeDetails, setRecipeDetails] = useState(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [replacingMeal, setReplacingMeal] = useState(null); // Format: 'Monday-lunch'
  const [shoppingList, setShoppingList] = useState(plan.shoppingList || []);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const submitFeedback = async (recipeId, accepted) => {
    setSubmittingFeedback(true);
    addLog(`Submitting feedback for recipe: ${recipeId} (${accepted ? 'accepted' : 'rejected'})`);

    try {
      const response = await fetch(`${AGENT_URL}/plan/${plan.planId}/recipe/${recipeId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted,
          rejectionReason: !accepted ? feedbackText : null,
          comment: accepted ? feedbackText : null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();
      addLog(`Feedback recorded successfully`, 'success');
      
      if (!accepted && feedbackText) {
        addLog('Profile will be updated based on your feedback');
      }

      // Submit rating if provided
      if (rating > 0) {
        await submitRating(recipeId, rating);
      }

      setShowFeedback(null);
      setFeedbackText('');
      setRating(0);
      setHoverRating(0);
    } catch (err) {
      addLog(`Error submitting feedback: ${err.message}`, 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const submitRating = async (recipeId, ratingValue) => {
    try {
      const response = await fetch(`${AGENT_URL}/plan/${plan.planId}/recipe/${recipeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: ratingValue,
          comment: feedbackText || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      addLog(`Rating saved: ${ratingValue} stars`, 'success');
    } catch (err) {
      addLog(`Error saving rating: ${err.message}`, 'error');
    }
  };

  const replaceRecipe = async (day, mealType) => {
    const mealKey = `${day}-${mealType}`;
    setReplacingMeal(mealKey);
    addLog(`Replacing ${mealType} for ${day}...`);

    try {
      const response = await fetch(`${AGENT_URL}/plan/${plan.planId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day,
          mealType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to replace recipe');
      }

      const data = await response.json();
      
      // Update the plan with the new recipe
      setPlan(data.updatedPlan);
      setShoppingList(data.updatedPlan.shoppingList || []);
      
      addLog(`✅ Replaced ${mealType} with "${data.newRecipe.title}"`, 'success');
      addLog(`Shopping list updated with ${data.updatedPlan.shoppingList.length} items`);
      
    } catch (err) {
      addLog(`❌ Error replacing recipe: ${err.message}`, 'error');
    } finally {
      setReplacingMeal(null);
    }
  };

  const removeShoppingItem = (index) => {
    const updatedList = shoppingList.filter((_, idx) => idx !== index);
    setShoppingList(updatedList);
    addLog('Item removed from shopping list', 'info');
  };

  const copyShoppingList = async () => {
    try {
      // Format shopping list as text
      const textToCopy = shoppingList.map((item, idx) => {
        const name = item.name;
        const qty = item.qtySuggested || item.qty || '';
        return `${idx + 1}. ${name} - ${qty}`;
      }).join('\n');

      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedToClipboard(true);
        addLog('Shopping list copied to clipboard!', 'success');
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedToClipboard(true);
        addLog('Shopping list copied to clipboard!', 'success');
        setTimeout(() => setCopiedToClipboard(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      addLog('Failed to copy shopping list', 'error');
    }
  };

  const viewRecipeDetails = async (recipeId) => {
    setLoadingRecipe(true);
    addLog(`Loading recipe details for ${recipeId}...`);
    
    try {
      const response = await fetch(`http://localhost:3001/recipes/${recipeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe details');
      }
      
      const data = await response.json();
      setRecipeDetails(data);
      setShowRecipeDetails(recipeId);
      addLog(`Recipe details loaded successfully`);
    } catch (err) {
      addLog(`Error loading recipe: ${err.message}`, 'error');
    } finally {
      setLoadingRecipe(false);
    }
  };

  const closeRecipeDetails = () => {
    setShowRecipeDetails(null);
    setRecipeDetails(null);
  };

  return (
    <div className="plan-view-container">
      <div className="plan-header">
        <button className="btn-back" onClick={() => setPlan(null)}>
          ← Back
        </button>
        <h1>Your Weekly Plan</h1>
        <div className="plan-info">
          <p>Week of {new Date(plan.weekStart).toLocaleDateString()}</p>
        </div>
      </div>

        <div className="week-plan">
          {plan.weekPlan.map((dayPlan) => (
            <div key={dayPlan.day} className="day-card">
              <div className="day-header">
                <h3>{dayPlan.day}</h3>
                {dayPlan.date && <span className="date">{new Date(dayPlan.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
              </div>
              
              {/* Lunch */}
              <div className="meal-section">
                <div className="meal-label">🌤️ Lunch</div>
                <div 
                  className="recipe-info clickable" 
                  onClick={() => viewRecipeDetails(dayPlan.lunch.id)}
                  title="Click to view recipe details"
                >
                  <h4>{dayPlan.lunch.title}</h4>
                  <div className="recipe-meta">
                    <span>🕐 {dayPlan.lunch.cookTimeMins} min</span>
                    <span>👥 {dayPlan.lunch.servings} servings</span>
                  </div>
                  <div className="view-hint">Click to view recipe</div>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      replaceRecipe(dayPlan.day, 'lunch');
                    }}
                    disabled={replacingMeal === `${dayPlan.day}-lunch`}
                  >
                    {replacingMeal === `${dayPlan.day}-lunch` ? '⏳ Replacing...' : '🔄 Replace'}
                  </button>
                  <button
                    className="btn-feedback"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeedback(dayPlan.lunch.id);
                    }}
                  >
                    Feedback
                  </button>
                </div>

                {showFeedback === dayPlan.lunch.id && (
                  <div className="feedback-modal">
                    <div className="feedback-content">
                      <h4>Feedback for {dayPlan.lunch.title}</h4>
                      
                      <div className="rating-section">
                        <label>Rate this recipe:</label>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Tell us what you think... (e.g., 'Too spicy', 'I don't like mushrooms', 'Takes too long')"
                        rows="4"
                      />
                      <div className="feedback-actions">
                        <button
                          className="btn-accept"
                          onClick={() => submitFeedback(dayPlan.lunch.id, true)}
                          disabled={submittingFeedback}
                        >
                          👍 Accept
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => submitFeedback(dayPlan.lunch.id, false)}
                          disabled={submittingFeedback}
                        >
                          👎 Reject
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowFeedback(null);
                            setFeedbackText('');
                            setRating(0);
                            setHoverRating(0);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dinner */}
              <div className="meal-section">
                <div className="meal-label">🌙 Dinner</div>
                <div 
                  className="recipe-info clickable" 
                  onClick={() => viewRecipeDetails(dayPlan.dinner.id)}
                  title="Click to view recipe details"
                >
                  <h4>{dayPlan.dinner.title}</h4>
                  <div className="recipe-meta">
                    <span>🕐 {dayPlan.dinner.cookTimeMins} min</span>
                    <span>👥 {dayPlan.dinner.servings} servings</span>
                  </div>
                  <div className="view-hint">Click to view recipe</div>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      replaceRecipe(dayPlan.day, 'dinner');
                    }}
                    disabled={replacingMeal === `${dayPlan.day}-dinner`}
                  >
                    {replacingMeal === `${dayPlan.day}-dinner` ? '⏳ Replacing...' : '🔄 Replace'}
                  </button>
                  <button
                    className="btn-feedback"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFeedback(dayPlan.dinner.id);
                    }}
                  >
                    Feedback
                  </button>
                </div>

                {showFeedback === dayPlan.dinner.id && (
                  <div className="feedback-modal">
                    <div className="feedback-content">
                      <h4>Feedback for {dayPlan.dinner.title}</h4>
                      
                      <div className="rating-section">
                        <label>Rate this recipe:</label>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                              onClick={() => setRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Tell us what you think... (e.g., 'Too spicy', 'I don't like mushrooms', 'Takes too long')"
                        rows="4"
                      />
                      <div className="feedback-actions">
                        <button
                          className="btn-accept"
                          onClick={() => submitFeedback(dayPlan.dinner.id, true)}
                          disabled={submittingFeedback}
                        >
                          👍 Accept
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => submitFeedback(dayPlan.dinner.id, false)}
                          disabled={submittingFeedback}
                        >
                          👎 Reject
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowFeedback(null);
                            setFeedbackText('');
                            setRating(0);
                            setHoverRating(0);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showRecipeDetails && recipeDetails && (
          <div className="recipe-details-modal" onClick={closeRecipeDetails}>
            <div className="recipe-details-content" onClick={(e) => e.stopPropagation()}>
              <button className="btn-close" onClick={closeRecipeDetails}>×</button>
              
              <div className="recipe-details-header">
                <h2>{recipeDetails.title}</h2>
                <div className="recipe-details-meta">
                  <span>🕐 {recipeDetails.cookTimeMins || recipeDetails.cook_time_minutes} minutes</span>
                  <span>👥 {recipeDetails.servings} servings</span>
                  {recipeDetails.tags && recipeDetails.tags.length > 0 && (
                    <div className="recipe-tags">
                      {recipeDetails.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="recipe-details-body">
                <section className="ingredients-section">
                  <h3>📝 Ingredients</h3>
                  <ul className="ingredients-list">
                    {recipeDetails.ingredients && recipeDetails.ingredients.map((ing, idx) => (
                      <li key={idx}>
                        <span className="ingredient-qty">{ing.qty || ing.quantity}</span>
                        <span className="ingredient-name">{ing.name || ing.item}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="instructions-section">
                  <h3>👨‍🍳 Instructions</h3>
                  <ol className="steps-list">
                    {recipeDetails.steps && recipeDetails.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
          </div>
        )}

        {plan.balancedDiet && plan.balancedDiet.metrics && (
          <div className="balanced-diet-section">
            <h2>🥗 Balanced Diet & Nutrition</h2>
            
            <div className="nutrition-metrics">
              <div className="metric-card">
                <div className="metric-label">Protein</div>
                <div className="metric-value">{(plan.balancedDiet.metrics.proteinRatio * 100).toFixed(0)}%</div>
                <div className="metric-bar">
                  <div className="metric-fill protein" style={{width: `${plan.balancedDiet.metrics.proteinRatio * 100}%`}}></div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Carbs</div>
                <div className="metric-value">{(plan.balancedDiet.metrics.carbsRatio * 100).toFixed(0)}%</div>
                <div className="metric-bar">
                  <div className="metric-fill carbs" style={{width: `${plan.balancedDiet.metrics.carbsRatio * 100}%`}}></div>
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-label">Fat</div>
                <div className="metric-value">{(plan.balancedDiet.metrics.fatRatio * 100).toFixed(0)}%</div>
                <div className="metric-bar">
                  <div className="metric-fill fat" style={{width: `${plan.balancedDiet.metrics.fatRatio * 100}%`}}></div>
                </div>
              </div>
            </div>
            
            {plan.balancedDiet.metrics.varietyScore && (
              <div className="variety-indicator">
                <strong>Variety Score:</strong> 
                <span className={`variety-badge variety-${plan.balancedDiet.metrics.varietyScore}`}>
                  {plan.balancedDiet.metrics.varietyScore.toUpperCase()}
                </span>
              </div>
            )}
            
            {plan.balancedDiet.replacements && plan.balancedDiet.replacements.length > 0 && (
              <div className="diet-replacements">
                <h3>🔄 Recipe Improvements</h3>
                {plan.balancedDiet.replacements.map((replacement, idx) => (
                  <div key={idx} className="replacement-card">
                    <div className="replacement-header">
                      <span className="day-badge">{replacement.day} {replacement.mealType}</span>
                    </div>
                    <div className="replacement-change">
                      <span className="old-recipe">{replacement.originalRecipeTitle}</span>
                      <span className="arrow">→</span>
                      <span className="new-recipe">{replacement.newRecipeTitle}</span>
                    </div>
                    <div className="replacement-reason">{replacement.reason}</div>
                  </div>
                ))}
              </div>
            )}
            
            {plan.balancedDiet.recommendations && plan.balancedDiet.recommendations.length > 0 && (
              <div className="diet-recommendations">
                <h3>💡 Nutrition Tips</h3>
                <ul>
                  {plan.balancedDiet.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {plan.wasteReduction && (
          <div className="waste-reduction-section">
            <h2>♻️ Waste Reduction Insights</h2>
            
            {plan.wasteReduction.estimatedWasteReduction && (
              <div className="waste-stat">
                <strong>Estimated Waste Reduction:</strong> {plan.wasteReduction.estimatedWasteReduction}
              </div>
            )}
            
            {plan.wasteReduction.substitutionSuggestions && plan.wasteReduction.substitutionSuggestions.length > 0 && (
              <div className="substitutions">
                <h3>🔄 Smart Substitutions</h3>
                {plan.wasteReduction.substitutionSuggestions.map((sub, idx) => (
                  <div key={idx} className="substitution-card">
                    <div className="sub-header">
                      <span className="sub-original">{sub.original}</span>
                      <span className="sub-arrow">→</span>
                      <span className="sub-replacement">{sub.substitute}</span>
                    </div>
                    <div className="sub-reason">{sub.reason}</div>
                  </div>
                ))}
              </div>
            )}
            
            {plan.wasteReduction.wasteReductionTips && plan.wasteReduction.wasteReductionTips.length > 0 && (
              <div className="waste-tips">
                <h3>💡 Tips to Reduce Waste</h3>
                <ul>
                  {plan.wasteReduction.wasteReductionTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {shoppingList && shoppingList.length > 0 && (
          <div className="shopping-section">
            <div className="shopping-header">
              <h2>🛒 Shopping List ({shoppingList.length} items)</h2>
              <button 
                className={`btn-copy ${copiedToClipboard ? 'copied' : ''}`}
                onClick={copyShoppingList}
              >
                {copiedToClipboard ? '✅ Copied!' : '📋 Copy List'}
              </button>
            </div>
            <div className="shopping-list">
              {shoppingList.map((item, idx) => (
                <div key={idx} className="shopping-item">
                  <div className="item-content">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">{item.qtySuggested || item.qty}</span>
                    </div>
                    {item.reuseNotes && (
                      <div className="item-notes">{item.reuseNotes}</div>
                    )}
                    {item.estimatedWaste && item.estimatedWaste !== 'low' && (
                      <div className={`waste-indicator waste-${item.estimatedWaste}`}>
                        ⚠️ {item.estimatedWaste} waste risk
                      </div>
                    )}
                  </div>
                  <button 
                    className="btn-remove-item"
                    onClick={() => removeShoppingItem(idx)}
                    title="Remove from list"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

export default PlanView;

