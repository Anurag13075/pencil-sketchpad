import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { Copy } from "lucide-react";

const REPO_RAW_BASE = "https://raw.githubusercontent.com/Anurag13075/pencil-sketchpad/main";

function generateZeropsYaml(buildCommand: string) {
  return `zerops:
  - setup: static
    build:
      base: nodejs@20
      buildCommands:
        - ${buildCommand}
      deployFiles:
        - dist/~
      cache:
        - node_modules
        - package-lock.json
    run:
      base: static
`;
}

export default function ConfigGenerator() {
  const [pkg, setPkg] = useState<any | null>(null);
  const [suggestedYaml, setSuggestedYaml] = useState<string | null>(null);
  const [dockerfile, setDockerfile] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const txt = await fetch(`${REPO_RAW_BASE}/package.json`).then((r) => r.ok ? r.text() : null);
        if (!txt) return;
        const pj = JSON.parse(txt);
        setPkg(pj);
        const buildCmd = pj.scripts?.build || "npm run build";
        setSuggestedYaml(generateZeropsYaml(buildCmd));
        setDockerfile(`FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN ${buildCmd}\nCMD ["npx","serve","-s","dist","-l","3000"]\n`);
      } catch (e) {
        // silent
      }
    })();
  }, []);

  async function copy(text?: string) {
    try {
      await navigator.clipboard.writeText(text || "");
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Zerops Config Generator</h3>
      </div>

      {pkg ? (
        <div>
          <div className="text-sm">Detected package.json</div>
          <div className="mt-2 text-xs text-muted-foreground">Name: {pkg.name} — Build: {pkg.scripts?.build || "(none)"}</div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Suggested zerops.yaml</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => copy(suggestedYaml || "")}>Copy</Button>
              </div>
            </div>
            <pre className="mt-2 rounded bg-slate-900 p-3 text-sm text-white max-h-64 overflow-auto">{suggestedYaml}</pre>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Suggested Dockerfile</div>
              <Button size="sm" onClick={() => copy(dockerfile || "")}>Copy</Button>
            </div>
            <pre className="mt-2 rounded bg-slate-900 p-3 text-sm text-white max-h-64 overflow-auto">{dockerfile}</pre>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No package.json detected in repo.</div>
      )}
    </Card>
  );
}
