# Changelog

All notable changes to the Mealprep Agent project will be documented in this file.

## [Unreleased]

### Added (Latest)
- **Recipe Details Modal**: Users can now view complete recipe information including ingredients and cooking instructions
  - Beautiful gradient header design
  - Organized ingredient list with quantities
  - Step-by-step cooking instructions
  - Recipe tags and metadata display
  - Responsive design for all screen sizes
  - Click outside to close functionality
- Recipe Tool API endpoint for fetching individual recipes by ID
- Enhanced button styling with proper spacing and responsiveness

### Changed
- Action buttons in day cards now wrap on smaller screens
- Improved button layout with flex-wrap support
- Enhanced modal styling with better visual hierarchy

---

## [0.2.0] - 2025-11-22

### Added
- **Custom Allergy/Dislike Input**: Manual input fields for adding custom allergies and dislikes
- CORS support across all backend services
- Helper scripts for easier development:
  - `start_all.sh`: Start all backend services
  - `stop_all.sh`: Stop all services
  - `dev.sh`: Development mode with auto-open browser
- Comprehensive setup documentation (SETUP.md)
- Features documentation (FEATURES.md)

### Fixed
- "Failed to fetch" errors caused by missing CORS configuration
- Frontend unable to communicate with backend services
- Service startup issues

### Changed
- Updated all Express servers to include CORS middleware
- Improved error handling in API calls
- Better logging for debugging

---

## [0.1.0] - 2025-11-22 (Initial Release)

### Added
- **Core Meal Planning System**
  - Weekly meal plan generation
  - User profile management
  - Recipe filtering by dietary preferences, allergies, and cook time
  - Shopping list aggregation
  - Feedback system with accept/reject functionality
  
- **Backend Microservices**
  - User Profile Tool (port 3000)
  - Recipe Tool (port 3001)
  - Shopping List Tool (port 3002)
  - Metrics Tool (port 3003)
  - Logger Tool (port 3004)
  - Main Agent/Orchestrator (port 4000)

- **Frontend UI**
  - React + Vite application
  - User preference input form
  - Weekly plan display
  - Feedback submission interface
  - Real-time logging panel
  - Shopping list display

- **AI Agent Stubs**
  - Recipe Generator (Python ADK)
  - Meal Planner (Python ADK)
  - Feedback Compactor (Python ADK)

- **Database**
  - JSON-based persistence
  - 60+ sample recipes
  - User profile storage
  - Plan history tracking

- **Scripts**
  - `seed_db.js`: Initialize database with sample data
  - `test_flow.js`: End-to-end testing script

- **Observability**
  - Metrics tracking (acceptance/rejection rates)
  - Event logging
  - Console-based monitoring

---

## Format

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

### Categories
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

