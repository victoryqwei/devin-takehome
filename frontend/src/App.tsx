import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { GitBranch, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Issue {
  number: number;
  title: string;
  body: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: Array<{ name: string; color: string }>;
}

interface Session {
  session_id: string;
  status: string;
  message?: string;
  session_url?: string;
  repo?: string;
  issue_number?: number;
  confidence_score?: number;
  action_plan?: string;
}

function App() {
  const [repo, setRepo] = useState(() => localStorage.getItem("github_repo") || "");
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem("github_token") || "");
  const [devinApiKey, setDevinApiKey] = useState(() => localStorage.getItem("devin_api_key") || "");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Record<number, Session>>({});
  const [configured, setConfigured] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState<Record<number, boolean>>({});
  const [expandedActionPlans, setExpandedActionPlans] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (repo) localStorage.setItem("github_repo", repo);
  }, [repo]);

  useEffect(() => {
    if (githubToken) localStorage.setItem("github_token", githubToken);
  }, [githubToken]);

  useEffect(() => {
    if (devinApiKey) localStorage.setItem("devin_api_key", devinApiKey);
  }, [devinApiKey]);

  const loadIssues = async () => {
    if (!repo || !githubToken) {
      setError("Please enter repository and GitHub token");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/issues?repo=${encodeURIComponent(repo)}&github_token=${encodeURIComponent(githubToken)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      setIssues(data);
      setConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  const scopeIssue = async (issueNumber: number) => {
    if (!devinApiKey) {
      setError("Please enter Devin API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/scope`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo,
          issue_number: issueNumber,
          github_token: githubToken,
          devin_api_key: devinApiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to scope issue");
      }

      const data = await response.json();
      setSessions((prev) => ({
        ...prev,
        [issueNumber]: data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scope issue");
    } finally {
      setLoading(false);
    }
  };

  const completeIssue = async (issueNumber: number) => {
    if (!devinApiKey) {
      setError("Please enter Devin API key");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const sessionId = sessions[issueNumber]?.session_id || "";
      const response = await fetch(`${API_URL}/api/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo,
          issue_number: issueNumber,
          github_token: githubToken,
          devin_api_key: devinApiKey,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete issue");
      }

      const data = await response.json();
      setSessions((prev) => ({
        ...prev,
        [issueNumber]: data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete issue");
    } finally {
      setLoading(false);
    }
  };

  const checkSessionStatus = useCallback(
    async (issueNumber: number, sessionId: string) => {
      if (!devinApiKey) return;

      try {
        const response = await fetch(`${API_URL}/api/session/${sessionId}?devin_api_key=${encodeURIComponent(devinApiKey)}`);

        if (!response.ok) {
          throw new Error("Failed to check session status");
        }

        const data = await response.json();
        setSessions((prev) => ({
          ...prev,
          [issueNumber]: data,
        }));
      } catch (err) {
        console.error("Failed to check session status:", err);
      }
    },
    [devinApiKey]
  );

  useEffect(() => {
    if (!devinApiKey) return;

    const interval = setInterval(() => {
      Object.entries(sessions).forEach(([issueNumber, session]) => {
        if (session.status === "scoping" || session.status === "implementing") {
          checkSessionStatus(Number(issueNumber), session.session_id);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [sessions, devinApiKey, checkSessionStatus]);

  if (!configured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">GitHub Issues Integration</CardTitle>
              <CardDescription>Connect your GitHub repository and Devin API to automate issue management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo">Repository (owner/repo)</Label>
                <Input id="repo" placeholder="e.g., facebook/react" value={repo} onChange={(e) => setRepo(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github-token">GitHub Personal Access Token</Label>
                <Input
                  id="github-token"
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="devin-key">Devin API Key</Label>
                <Input
                  id="devin-key"
                  type="password"
                  placeholder="Your Devin API key"
                  value={devinApiKey}
                  onChange={(e) => setDevinApiKey(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={loadIssues} disabled={loading || !repo || !githubToken || !devinApiKey} className="w-full">
                {loading ? <Spinner className="mr-2" /> : null}
                Connect and Load Issues
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">GitHub Issues Dashboard</h1>
          <p className="text-slate-600">
            Repository: <span className="font-semibold">{repo}</span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setConfigured(false)} className="mt-2">
            Change Configuration
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {issues.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">No open issues found</p>
              </CardContent>
            </Card>
          ) : (
            issues.map((issue) => {
              const session = sessions[issue.number];

              return (
                <Card key={issue.number} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          #{issue.number}: {issue.title}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap mb-2">
                          {issue.labels.map((label) => (
                            <Badge key={label.name} style={{ backgroundColor: `#${label.color}` }} className="text-white">
                              {label.name}
                            </Badge>
                          ))}
                        </div>
                        {issue.body && (
                          <Collapsible
                            open={expandedIssues[issue.number]}
                            onOpenChange={(open) => setExpandedIssues((prev) => ({ ...prev, [issue.number]: open }))}>
                            <div className="flex items-center gap-2">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-slate-600 hover:text-slate-900">
                                  {expandedIssues[issue.number] ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Hide description
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Show description
                                    </>
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="mt-2">
                              <div className="markdown-body bg-white border border-gray-200 rounded-md p-4">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkBreaks]}
                                  components={{
                                    // Links - open in new tab
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline">
                                        {children}
                                      </a>
                                    ),

                                    // Task lists - make checkboxes interactive
                                    input: ({ type, checked }) =>
                                      type === "checkbox" ? <input type="checkbox" checked={checked} readOnly className="mr-2" /> : null,

                                    // Code blocks
                                    code: ({ children, className }) => {
                                      const isInline = !className;

                                      if (isInline) {
                                        return (
                                          <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                                        );
                                      }

                                      return (
                                        <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto mb-2 text-xs font-mono">
                                          <code>{children}</code>
                                        </pre>
                                      );
                                    },
                                  }}>
                                  {issue.body}
                                </ReactMarkdown>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                        {!issue.body && <CardDescription>No description provided</CardDescription>}
                      </div>
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="ml-4">
                        <ExternalLink className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                      </a>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button onClick={() => scopeIssue(issue.number)} disabled={loading || !!session} variant="outline">
                        <GitBranch className="mr-2 h-4 w-4" />
                        Scope Issue
                      </Button>

                      <Button
                        onClick={() => completeIssue(issue.number)}
                        disabled={loading || session?.status === "implementing"}
                        variant="default">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Issue
                      </Button>
                    </div>

                    {session && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">Session Status:</span>
                          <Badge
                            variant={
                              session.status === "implementing" ? "default" : session.status === "scoping" ? "secondary" : "outline"
                            }>
                            {session.status}
                          </Badge>
                        </div>
                        {session.message && <p className="text-sm text-slate-600 mb-2">{session.message}</p>}
                        {session.confidence_score !== undefined && (
                          <div className="mb-2">
                            <span className="text-sm font-semibold">Confidence Score: </span>
                            <Badge
                              variant={
                                session.confidence_score >= 80 ? "default" : session.confidence_score >= 50 ? "secondary" : "destructive"
                              }>
                              {session.confidence_score}/100
                            </Badge>
                          </div>
                        )}
                        {session.action_plan && (
                          <div className="mb-2">
                            <Collapsible
                              open={expandedActionPlans[issue.number]}
                              onOpenChange={(open) => setExpandedActionPlans((prev) => ({ ...prev, [issue.number]: open }))}>
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="p-0 h-auto font-normal text-slate-600 hover:text-slate-900">
                                    <span className="text-sm font-semibold">Action Plan:</span>
                                    {expandedActionPlans[issue.number] ? (
                                      <ChevronUp className="h-4 w-4 ml-1" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 ml-1" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                              <CollapsibleContent className="mt-2">
                                <div className="prose prose-sm max-w-none text-slate-700 bg-white p-3 rounded-md border border-slate-200">
                                  <ReactMarkdown>{session.action_plan}</ReactMarkdown>
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        )}
                        {session.session_url && (
                          <a
                            href={session.session_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            View Devin Session
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
