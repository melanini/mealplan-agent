# Mealprep Agent - Features

## 📋 Weekly Meal Planning

Generate a personalized weekly meal plan based on your dietary preferences, allergies, and dislikes.

### Key Features:

#### 1. **User Preferences**
- Select from predefined dietary styles (Vegetarian, Pescetarian, Vegan, etc.)
- Choose number of servings (2, 4, or 6)
- Specify allergies/intolerances (with custom input option)
- Indicate food dislikes (with custom input option)

#### 2. **Recipe Details View** ✨ NEW
View complete recipe information for any meal in your weekly plan:

- **📖 Click "View Details"** on any day's recipe card
- **Beautiful Modal Display** with gradient header
- **Complete Ingredient List** with quantities
- **Step-by-Step Instructions** numbered for easy following
- **Recipe Metadata**: cooking time, servings, tags
- **Responsive Design**: works on mobile and desktop

##### How to Use:
1. Generate your weekly plan
2. Click the **"📖 View Details"** button on any day card
3. Browse ingredients and cooking instructions
4. Click outside the modal or press the × button to close

#### 3. **Feedback System**
Provide feedback on recipes to improve future recommendations:

- **👍 Accept**: Mark recipes you liked
- **👎 Reject**: Tell us why you didn't like a recipe
- **Auto-Learning**: Your feedback updates your profile automatically

#### 4. **Recipe Replacement**
Don't like a suggested recipe? Request a replacement (coming soon)

#### 5. **Shopping List Generation**
Automatically aggregates all ingredients from your weekly plan into a unified shopping list.

#### 6. **Real-Time Logs**
Monitor system activity with live logs showing:
- Profile updates
- Recipe fetching
- Plan generation progress
- Feedback processing
- Errors and warnings

---

## 🎨 UI/UX Highlights

### Modern Design
- Clean, card-based layout
- Intuitive navigation
- Color-coded buttons for different actions
- Responsive grid system

### Accessibility
- Large touch targets for mobile
- Clear visual feedback on interactions
- Keyboard-friendly modals
- High contrast text

### Performance
- Fast recipe loading
- Smooth modal animations
- Optimized API calls
- Local state management

---

## 🔧 Technical Features

### Backend Architecture
- **Microservices**: Separate tools for profiles, recipes, shopping, metrics, logs
- **Session Management**: In-memory session tracking with TTL
- **Feedback Compaction**: AI-powered preference extraction (stub)
- **CORS Enabled**: Cross-origin requests supported

### Frontend Stack
- **React + Vite**: Fast development and hot module replacement
- **Modern CSS**: Flexbox, Grid, custom properties
- **State Management**: React hooks (useState)
- **API Communication**: Fetch API for REST calls

### Data Flow
```
User Input → Frontend → Agent (Orchestrator) → Tools → Database
                ↓                                      ↑
            State Update ← Response ← Aggregation ←───┘
```

---

## 🚀 Coming Soon

- [ ] AI-powered recipe generation with Gemini LLM
- [ ] Advanced meal planning with variety optimization
- [ ] Google Sheets shopping list export
- [ ] Recipe ratings and favorites
- [ ] Nutritional information display
- [ ] Multi-week planning
- [ ] Recipe sharing and community features
- [ ] Mobile app version

---

## 📊 Observability

Track system health and usage:
- **Metrics Dashboard**: View acceptance/rejection rates
- **Event Logs**: Monitor all system events
- **Performance Tracking**: Response times and error rates
- **User Analytics**: Usage patterns and preferences

Access the observability dashboard at: `/logs` (coming soon)

---

## 💡 Tips & Tricks

1. **Be Specific with Feedback**: The more detailed your feedback, the better the system learns
2. **Update Your Profile**: Add new allergies or dislikes as you discover them
3. **Check Recipe Details First**: View full instructions before providing feedback
4. **Use Custom Inputs**: Add any specific ingredient you want to avoid
5. **Review Shopping List**: Verify quantities match your needs

---

For setup instructions, see [SETUP.md](./SETUP.md)

