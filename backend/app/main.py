from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

app = FastAPI()

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

sessions_db = {}
CONFIDENCE_SCORES_FILE = Path("confidence_scores.json")

def load_confidence_scores():
    if CONFIDENCE_SCORES_FILE.exists():
        with open(CONFIDENCE_SCORES_FILE, "r") as f:
            return json.load(f)
    return {}

def save_confidence_scores(scores):
    with open(CONFIDENCE_SCORES_FILE, "w") as f:
        json.dump(scores, f, indent=2)

def parse_confidence_and_plan(text: str):
    confidence_match = re.search(r'CONFIDENCE:\s*(\d+)', text, re.IGNORECASE)
    confidence_score = int(confidence_match.group(1)) if confidence_match else None
    
    plan_match = re.search(r'ACTION PLAN:\s*(.+)', text, re.IGNORECASE | re.DOTALL)
    action_plan = plan_match.group(1).strip() if plan_match else None
    
    return confidence_score, action_plan

class Issue(BaseModel):
    number: int
    title: str
    body: Optional[str]
    state: str
    html_url: str
    created_at: str
    updated_at: str
    labels: List[dict]

class ScopeRequest(BaseModel):
    repo: str
    issue_number: int
    github_token: str
    devin_api_key: str

class CompleteRequest(BaseModel):
    repo: str
    issue_number: int
    github_token: str
    devin_api_key: str
    session_id: str

class SessionStatus(BaseModel):
    session_id: str
    status: str
    confidence_score: Optional[int] = None
    action_plan: Optional[str] = None

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/issues")
async def get_issues(repo: str, github_token: str):
    async with httpx.AsyncClient() as client:
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        try:
            response = await client.get(
                f"https://api.github.com/repos/{repo}/issues",
                headers=headers,
                params={"state": "open"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

@app.post("/api/scope")
async def scope_issue(request: ScopeRequest):
    async with httpx.AsyncClient(timeout=30.0) as client:
        gh_headers = {
            "Authorization": f"Bearer {request.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }

        try:
            issue_response = await client.get(
                f"https://api.github.com/repos/{request.repo}/issues/{request.issue_number}",
                headers=gh_headers
            )
            issue_response.raise_for_status()
            issue_data = issue_response.json()
        except httpx.HTTPError as e:
            print(f"GitHub API error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

        devin_headers = {
            "Authorization": f"Bearer {request.devin_api_key}",
            "Content-Type": "application/json"
        }
        
        prompt = f"""Please analyze this GitHub issue and provide:
1. A confidence score (0-100) indicating how feasible this issue is to complete
2. A detailed action plan for implementing the solution

Issue: {issue_data['title']}
Description: {issue_data.get('body', 'No description provided')}
Repository: {request.repo}

Format your response as:
CONFIDENCE: [score]
ACTION PLAN:
[detailed plan]"""

        try:
            session_response = await client.post(
                "https://api.devin.ai/v1/sessions",
                headers=devin_headers,
                json={
                    "prompt": prompt,
                    "repo_path_or_url": f"https://github.com/{request.repo}"
                }
            )
            session_response.raise_for_status()
            session_data = session_response.json()
            session_id = session_data["session_id"]
            
            sessions_db[session_id] = {
                "repo": request.repo,
                "issue_number": request.issue_number,
                "status": "scoping",
                "type": "scope"
            }
            
            return {
                "session_id": session_id,
                "status": "scoping",
                "message": "Devin is analyzing the issue"
            }
        except httpx.HTTPError as e:
            print(f"Devin API error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Devin API error: {str(e)}")

@app.post("/api/complete")
async def complete_issue(request: CompleteRequest):
    async with httpx.AsyncClient(timeout=30.0) as client:
        gh_headers = {
            "Authorization": f"Bearer {request.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        try:
            issue_response = await client.get(
                f"https://api.github.com/repos/{request.repo}/issues/{request.issue_number}",
                headers=gh_headers
            )
            issue_response.raise_for_status()
            issue_data = issue_response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

        devin_headers = {
            "Authorization": f"Bearer {request.devin_api_key}",
            "Content-Type": "application/json"
        }
        
        if request.session_id and request.session_id in sessions_db:
            prompt = "Please proceed with implementing the solution based on the action plan you provided."
            try:
                message_response = await client.post(
                    f"https://api.devin.ai/v1/sessions/{request.session_id}/message",
                    headers=devin_headers,
                    json={"message": prompt}
                )
                message_response.raise_for_status()
                
                sessions_db[request.session_id]["status"] = "implementing"
                
                return {
                    "session_id": request.session_id,
                    "status": "implementing",
                    "message": "Devin is working on completing the issue"
                }
            except httpx.HTTPError as e:
                raise HTTPException(status_code=500, detail=f"Devin API error: {str(e)}")
        else:
            prompt = f"""Please complete this GitHub issue by implementing the solution and creating a PR.

Issue: {issue_data['title']}
Description: {issue_data.get('body', 'No description provided')}
Repository: {request.repo}

Please:
1. Analyze the issue
2. Implement the solution
3. Test your changes
4. Create a PR with your implementation"""

            try:
                session_response = await client.post(
                    "https://api.devin.ai/v1/sessions",
                    headers=devin_headers,
                    json={
                        "prompt": prompt,
                        "repo_path_or_url": f"https://github.com/{request.repo}"
                    }
                )
                session_response.raise_for_status()
                session_data = session_response.json()
                session_id = session_data["session_id"]
                
                sessions_db[session_id] = {
                    "repo": request.repo,
                    "issue_number": request.issue_number,
                    "status": "implementing",
                    "type": "complete"
                }
                
                return {
                    "session_id": session_id,
                    "status": "implementing",
                    "message": "Devin is working on completing the issue"
                }
            except httpx.HTTPError as e:
                raise HTTPException(status_code=500, detail=f"Devin API error: {str(e)}")

@app.get("/api/session/{session_id}")
async def get_session_status(session_id: str, devin_api_key: str):
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        devin_headers = {
            "Authorization": f"Bearer {devin_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = await client.get(
                f"https://api.devin.ai/v1/sessions/{session_id}",
                headers=devin_headers
            )
            response.raise_for_status()
            session_data = response.json()
            
            result = {
                "session_id": session_id,
                "status": session_data.get("status", "unknown"),
                "session_url": f"https://app.devin.ai/sessions/{session_id}",
                **sessions_db[session_id]
            }
            
            confidence_scores = load_confidence_scores()
            session_key = f"{sessions_db[session_id]['repo']}:{sessions_db[session_id]['issue_number']}"
            
            if session_key in confidence_scores:
                result["confidence_score"] = confidence_scores[session_key]["confidence_score"]
                result["action_plan"] = confidence_scores[session_key]["action_plan"]
                result["should_poll"] = False
            elif sessions_db[session_id].get("type") == "scope":
                try:
                    all_text = ""
                    for msg in session_data.get("messages", []):
                        if msg.get("type") == "devin_message":
                            all_text += msg.get("message", "") + "\n"
                    
                    if all_text:
                        confidence_score, action_plan = parse_confidence_and_plan(all_text)
                        if confidence_score is not None:
                            confidence_scores[session_key] = {
                                "confidence_score": confidence_score,
                                "action_plan": action_plan,
                                "session_id": session_id
                            }
                            save_confidence_scores(confidence_scores)
                            
                            result["confidence_score"] = confidence_score
                            result["action_plan"] = action_plan
                            result["should_poll"] = False
                        else:
                            result["should_poll"] = True
                    else:
                        result["should_poll"] = True
                except Exception as e:
                    print(f"Failed to parse messages: {e}")
                    result["should_poll"] = True
            else:
                result["should_poll"] = result["status"] in ["scoping", "implementing"]
            
            return result
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Devin API error: {str(e)}")
