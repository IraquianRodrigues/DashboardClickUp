import fs from "fs";
import path from "path";

export interface AIInsight {
  date: string;
  generatedAt: string;
  insights: string;
  metricsSummary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
    blocked: number;
  };
}

function getStorePath(): string {
  // On Vercel, use /tmp (ephemeral but works within same invocation window)
  // Locally, use data/ directory in project root
  if (process.env.VERCEL) {
    return "/tmp/ai-insights.json";
  }
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "ai-insights.json");
}

export function saveInsight(insight: AIInsight): void {
  const storePath = getStorePath();
  
  let history: AIInsight[] = [];
  if (fs.existsSync(storePath)) {
    try {
      history = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    } catch {
      history = [];
    }
  }

  // Keep last 30 days of insights
  history.unshift(insight);
  history = history.slice(0, 30);

  fs.writeFileSync(storePath, JSON.stringify(history, null, 2), "utf-8");
}

export function getLatestInsight(): AIInsight | null {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) return null;

  try {
    const history: AIInsight[] = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    return history[0] || null;
  } catch {
    return null;
  }
}

export function getInsightHistory(limit = 7): AIInsight[] {
  const storePath = getStorePath();
  if (!fs.existsSync(storePath)) return [];

  try {
    const history: AIInsight[] = JSON.parse(fs.readFileSync(storePath, "utf-8"));
    return history.slice(0, limit);
  } catch {
    return [];
  }
}
