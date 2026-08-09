import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pre } from "@/components/ui/pre";
import { Input } from "@/components/ui/input"; 
import { toast } from "@/components/ui/sonner";

const REPO_RAW_BASE = "https://raw.githubusercontent.com/Anurag13075/pencil-sketchpad/main";
const REPO_URL = "https://github.com/Anurag13075/pencil-sketchpad";

function existsRaw(path: string) {
  const url = `${REPO_RAW_BASE}/${path}`;
  return fetch(url, { method: "HEAD" }).then((r) => r.ok).catch(() => false);
}

export default function QuickStartPanel() {
  const [hasZeropsYaml, setHasZeropsYaml] = useState<boolean | null>(null);
  const [hasBuildScript, setHasBuildScript] = useState<boolean | null>(null);
  const [hasDist, setHasDist] = useState<boolean | null>(null);
  const [yaml, setYaml] = useState<string | null>(null);
  const [loadingYaml, setLoadingYaml] = useState(false);

  useEffect(() => {
    (async () => {
      setHasZeropsYaml(await existsRaw("zerops.yaml"));
      const pkgText = await fetch(`${REPO_RAW_BASE}/package.json`).then((r) => r.ok ? r.text() : null).catch(() => null);
      if (pkgText) {
        try {
          const pkg = JSON.parse(pkgText);
          setHasBuildScript(!!(pkg.scripts && (pkg.scripts.build || pkg.scripts["build:prod"])));
        } catch {
          setHasBuildScript(null);
        }
      } else {
        setHasBuildScript(false);
      }
      setHasDist(await existsRaw("dist/index.html"));
    })();
  }, []);

  async function loadYaml() {
    setLoadingYaml(true);
    try {
      const r = await fetch(`${REPO_RAW_BASE}/zerops.yaml`);
      if (!r.ok) throw new Error("zerops.yaml not found in repo");
      const text = await r.text();
      setYaml(text);
    } catch (e: any) {
      toast.error(e.message || "Failed to load zerops.yaml");
    } finally {
      setLoadingYaml(false);
    }
  }

  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Zerops Quick Start</h3>
        <Badge variant={hasZeropsYaml ? "success" : "secondary"}>{hasZeropsYaml ? "zerops.yaml found" : "no zerops.yaml"}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button onClick={() => window.open(`https://app.zerops.io/import?repo=${encodeURIComponent(REPO_URL)}`, "_blank")}>One‑click Import to Zerops</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadYaml} disabled={!hasZeropsYaml || loadingYaml}>
            {loadingYaml ? "Loading..." : "Preview zerops.yaml"}
          </Button>
          <Button variant="ghost" onClick={() => navigator.clipboard.writeText(REPO_URL)}>
            Copy repo URL
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="p-3 border rounded">
          <div className="text-sm font-medium">Build script</div>
          <div className="text-xs mt-1">{hasBuildScript === null ? "Unknown" : hasBuildScript ? "Found" : "Missing"}</div>
        </div>
        <div className="p-3 border rounded">
          <div className="text-sm font-medium">Static dist</div>
          <div className="text-xs mt-1">{hasDist === null ? "Unknown" : hasDist ? "Found" : "Missing"}</div>
        </div>
        <div className="p-3 border rounded">
          <div className="text-sm font-medium">Zerops config</div>
          <div className="text-xs mt-1">{hasZeropsYaml === null ? "Checking..." : hasZeropsYaml ? "Present" : "Not present"}</div>
        </div>
      </div>

      {yaml && (
        <div>
          <div className="text-sm font-medium mb-2">zerops.yaml (preview)</div>
          <pre className="rounded bg-slate-900 p-3 text-sm text-white max-h-64 overflow-auto">{yaml}</pre>
        </div>
      )}
    </Card>
  );
}
