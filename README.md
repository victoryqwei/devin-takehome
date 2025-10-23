# Devin Takehome - GitHub Issues Integration

This repository contains a GitHub Issues Integration automation built with Devin and the Devin API.

## Project Overview

The GitHub Issues Integration is a full-stack application that allows you to:
- View GitHub issues from any repository
- Scope issues using Devin's AI to get confidence scores and action plans
- Automatically complete issues by triggering Devin sessions that implement solutions and create PRs
- Track Devin session progress in real-time

## Project Structure

```
github-issues-integration/
├── backend/           # FastAPI backend with GitHub and Devin API integration
├── frontend/          # React + TypeScript frontend with Tailwind CSS
├── README.md          # Detailed setup and usage instructions
└── ARCHITECTURE.md    # Technical architecture documentation
```

## Quick Start

See the [detailed README](./github-issues-integration/README.md) in the `github-issues-integration` directory for complete setup instructions.

### Prerequisites
- Python 3.12+
- Node.js 18+
- GitHub Personal Access Token
- Devin API Key

### Running Locally

**Backend:**
```bash
cd github-issues-integration/backend
poetry install
poetry run fastapi dev app/main.py
```

**Frontend:**
```bash
cd github-issues-integration/frontend
npm install
npm run dev
```

## Features

### 1. Issues Dashboard
- View all open issues from any GitHub repository
- Display issue titles, descriptions, and labels
- Direct links to GitHub issues

### 2. Scope Issues
- Click "Scope Issue" to trigger Devin analysis
- Devin provides confidence scores and action plans
- View session status and link to Devin session

### 3. Complete Issues
- Click "Complete Issue" to trigger Devin implementation
- Devin creates a solution and submits a PR
- Continue from scoping session if available

### 4. Session Tracking
- Real-time status updates every 10 seconds
- View Devin session links
- Track progress from scoping to completion

## Technology Stack

**Backend:**
- FastAPI (Python web framework)
- httpx (Async HTTP client)
- Pydantic (Data validation)

**Frontend:**
- React 18 with TypeScript
- Vite (Build tool)
- Tailwind CSS (Styling)
- shadcn/ui (UI components)
- Lucide React (Icons)

## Documentation

- [Setup and Usage Guide](./github-issues-integration/README.md)
- [Architecture Documentation](./github-issues-integration/ARCHITECTURE.md)

## Implementation Notes

This project was built as part of the Devin takehome assignment. It demonstrates:
- Integration with GitHub API for issue management
- Integration with Devin API for automated development
- Full-stack application development with modern tools
- Clean, maintainable code architecture
- Comprehensive documentation

## License

This project is for demonstration purposes as part of the Devin takehome assignment.
