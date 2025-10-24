# Architecture Overview

## System Design

The GitHub Issues Integration is a full-stack application that bridges GitHub Issues with the Devin API to automate issue management workflows.

### High-Level Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Backend   │ ◄─────► │  GitHub API │
│  (React)    │         │  (FastAPI)  │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │  Devin API  │
                        │             │
                        └─────────────┘
```

## Component Details

### Frontend (React + TypeScript)

**Purpose**: Provide a user-friendly interface for managing GitHub issues with Devin automation.

**Key Components**:

- Configuration screen for credentials
- Issues dashboard with list view
- Action buttons for scoping and completing issues
- Real-time session status tracking

**State Management**:

- Local React state for UI state
- Polling mechanism for session updates (10-second intervals)
- Session data cached in component state

**API Communication**:

- RESTful API calls to backend
- Async/await pattern for all API requests
- Error handling with user-friendly messages

### Backend (FastAPI)

**Purpose**: Orchestrate communication between GitHub API and Devin API while managing session state.

**Endpoints**:

1. `GET /api/issues`

   - Fetches open issues from GitHub repository
   - Parameters: repo, github_token
   - Returns: Array of issue objects

2. `POST /api/scope`

   - Creates Devin session to analyze issue
   - Body: repo, issue_number, github_token, devin_api_key
   - Returns: Session ID and status

3. `POST /api/complete`

   - Creates or continues Devin session to implement solution
   - Body: repo, issue_number, github_token, devin_api_key, session_id
   - Returns: Session ID and status

4. `GET /api/session/{session_id}`
   - Retrieves current session status from Devin API
   - Parameters: devin_api_key
   - Returns: Session status and metadata

**Data Storage**:

- In-memory dictionary for session tracking
- Session data includes: repo, issue_number, status, type
- Data persists during runtime only

**External API Integration**:

- GitHub API v3 (REST)
- Devin API v1
- Async HTTP client (httpx) for all external calls

## Data Flow

### Issue Loading Flow

1. User enters repository and credentials
2. Frontend calls `GET /api/issues`
3. Backend authenticates with GitHub API
4. Backend fetches open issues
5. Issues returned to frontend
6. Frontend displays issues in dashboard

### Scoping Flow

1. User clicks "Scope Issue" button
2. Frontend calls `POST /api/scope`
3. Backend fetches issue details from GitHub
4. Backend creates Devin session with scoping prompt
5. Backend stores session metadata
6. Session ID returned to frontend
7. Frontend begins polling for status updates

### Completion Flow

1. User clicks "Complete Issue" button
2. Frontend calls `POST /api/complete`
3. Backend checks for existing session
4. If session exists: Send continuation message
5. If no session: Create new session with completion prompt
6. Backend updates session status
7. Session ID returned to frontend
8. Frontend polls for status updates

### Status Polling Flow

1. Frontend timer triggers every 10 seconds
2. For each active session (scoping/implementing)
3. Frontend calls `GET /api/session/{session_id}`
4. Backend queries Devin API for session status
5. Updated status returned to frontend
6. Frontend updates UI with new status

## Security Considerations

### Authentication

- GitHub tokens passed via API requests (not stored)
- Devin API keys passed via API requests (not stored)
- No persistent credential storage

### CORS

- Enabled for all origins in development
- Should be restricted to specific domains in production

### Data Privacy

- No logging of sensitive tokens
- Session data stored temporarily in memory
- No persistent database (reduces attack surface)

## Scalability Considerations

### Current Limitations

- In-memory storage limits to single instance
- No horizontal scaling support
- Session data lost on restart

### Future Improvements

- Add Redis for distributed session storage
- Implement database for persistent session history
- Add caching layer for GitHub API responses
- Implement webhook listeners for real-time updates

## Error Handling

### Frontend

- Try-catch blocks around all API calls
- User-friendly error messages
- Loading states during async operations
- Disabled buttons during processing

### Backend

- HTTPException for API errors
- Proper status codes (404, 500, etc.)
- Error details in response body
- Graceful handling of external API failures

## Performance Optimizations

### Frontend

- Conditional rendering to minimize DOM updates
- Debounced polling (10-second intervals)
- Lazy loading of issue details
- Efficient state updates with functional setState

### Backend

- Async/await for non-blocking I/O
- Connection pooling via httpx
- Timeout configuration (30 seconds)
- Minimal data transformation

## Monitoring and Observability

### Current State

- Console logging for debugging
- HTTP status codes for error tracking
- Session status for progress monitoring

### Recommended Additions

- Structured logging (JSON format)
- Application metrics (request counts, latencies)
- Error tracking service integration
- Health check endpoints with detailed status

## Deployment Architecture

### Backend Deployment

- Platform: Fly.io
- Runtime: Python 3.12 with Poetry
- Auto-scaling: Not configured
- Health checks: /healthz endpoint

### Frontend Deployment

- Platform: Static hosting (Vercel/Netlify/etc.)
- Build: Vite production build
- CDN: Automatic via hosting platform
- Environment: VITE_API_URL configured for production backend

## API Rate Limits

### GitHub API

- Unauthenticated: 60 requests/hour
- Authenticated: 5000 requests/hour
- Recommendation: Always use authenticated requests

### Devin API

- Varies by plan
- Should implement retry logic with exponential backoff
- Consider request queuing for high-volume scenarios

## Testing Strategy

### Unit Tests (Not Implemented)

- Backend: Test individual endpoint handlers
- Frontend: Test component rendering and interactions

### Integration Tests (Not Implemented)

- Test full flow from frontend to backend
- Mock external API responses
- Verify session state management

### Manual Testing (Completed)

- Verified issue loading
- Tested scoping functionality
- Tested completion functionality
- Confirmed session status updates
