# GitHub Issues Integration with Devin

A full-stack application that integrates GitHub Issues with the Devin API to automate issue management. This tool allows you to view GitHub issues, scope them with Devin's AI assistance, and automatically complete tickets.

## Features

- **Issues Dashboard**: View all open issues from any GitHub repository
- **Scope Issues**: Use Devin to analyze issues and provide confidence scores and action plans
- **Complete Issues**: Trigger Devin sessions to automatically implement solutions and create PRs
- **Session Tracking**: Monitor Devin session status in real-time
- **Clean UI**: Modern, responsive interface built with React, Tailwind CSS, and shadcn/ui

## Architecture

### Backend (FastAPI)
- **GitHub API Integration**: Fetches issues from GitHub repositories
- **Devin API Integration**: Creates and manages Devin sessions
- **In-memory Session Storage**: Tracks active Devin sessions (data persists during runtime)
- **RESTful API**: Provides endpoints for frontend communication

### Frontend (React + TypeScript)
- **Configuration Screen**: Input repository, GitHub token, and Devin API key
- **Issues List**: Display all open issues with labels and descriptions
- **Action Buttons**: Scope and complete issues with a single click
- **Session Status**: Real-time updates on Devin session progress

## API Endpoints

### Backend Endpoints

- `GET /healthz` - Health check endpoint
- `GET /api/issues?repo={owner/repo}&github_token={token}` - Fetch issues from GitHub
- `POST /api/scope` - Create a Devin session to scope an issue
- `POST /api/complete` - Create or continue a Devin session to complete an issue
- `GET /api/session/{session_id}?devin_api_key={key}` - Get session status

## Setup Instructions

### Prerequisites

- Python 3.12+
- Node.js 18+
- GitHub Personal Access Token with `repo` scope
- Devin API Key

### Backend Setup

```bash
cd backend
poetry install
poetry run fastapi dev app/main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### Environment Variables

#### Backend
Create a `.env` file in the `backend` directory (optional, as tokens are passed via API):
```
# No environment variables required - tokens passed via API requests
```

#### Frontend
Create a `.env` file in the `frontend` directory:
```
VITE_API_URL=http://localhost:8000
```

For production, update this to your deployed backend URL.

## Usage

1. **Configure Access**
   - Enter your GitHub repository in the format `owner/repo` (e.g., `facebook/react`)
   - Provide your GitHub Personal Access Token
   - Provide your Devin API Key
   - Click "Connect and Load Issues"

2. **View Issues**
   - Browse all open issues from the repository
   - See issue titles, descriptions, and labels
   - Click the external link icon to view issues on GitHub

3. **Scope an Issue**
   - Click "Scope Issue" to have Devin analyze the issue
   - Devin will provide a confidence score and action plan
   - View the session status and link to the Devin session

4. **Complete an Issue**
   - Click "Complete Issue" to have Devin implement the solution
   - If you previously scoped the issue, Devin will continue from that session
   - Otherwise, a new session will be created
   - Monitor progress via the session status indicator

## Deployment

### Backend Deployment

The backend can be deployed to Fly.io using the built-in deployment command:

```bash
cd backend
# Deploy command will be provided in deployment instructions
```

### Frontend Deployment

The frontend can be deployed as a static site:

```bash
cd frontend
npm run build
# Deploy the dist/ directory to your hosting provider
```

Remember to update the `VITE_API_URL` in the frontend `.env` file to point to your deployed backend URL.

## Technical Details

### Backend Stack
- FastAPI: Modern Python web framework
- httpx: Async HTTP client for API calls
- Pydantic: Data validation and settings management
- python-dotenv: Environment variable management

### Frontend Stack
- React 18: UI library
- TypeScript: Type-safe JavaScript
- Vite: Build tool and dev server
- Tailwind CSS: Utility-first CSS framework
- shadcn/ui: Pre-built UI components
- Lucide React: Icon library

### Data Flow

1. User enters credentials and repository information
2. Frontend fetches issues from backend
3. Backend calls GitHub API to retrieve issues
4. User triggers scope or complete action
5. Backend creates Devin session via Devin API
6. Frontend polls session status every 10 seconds
7. User can view Devin session progress via provided link

## Limitations

- Session data is stored in-memory and will be lost on backend restart
- GitHub API rate limits apply (60 requests/hour for unauthenticated, 5000 for authenticated)
- Devin API rate limits apply based on your plan
- Tokens are stored in browser state (not persisted)

## Security Notes

- Tokens are never logged or stored permanently
- All API communication uses HTTPS in production
- CORS is enabled for development (should be restricted in production)
- Tokens are passed via API requests, not stored in backend

## Future Enhancements

- Persistent session storage (database)
- Webhook integration for automatic issue detection
- Multi-repository support
- Issue filtering and search
- Confidence score visualization
- Action plan display in UI
- PR status tracking
- Issue assignment automation
