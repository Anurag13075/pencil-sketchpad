import QuickStartPanel from "@/integrations/zerops/QuickStartPanel";
import ConfigGenerator from "@/integrations/zerops/ConfigGenerator";

export default function ZeropsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <QuickStartPanel /> 
      <ConfigGenerator />
    </div>
  );
}
