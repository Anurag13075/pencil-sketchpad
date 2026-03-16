import { Link } from "react-router-dom";
import { Pencil as PencilIcon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <PencilIcon size={18} strokeWidth={1.5} className="text-primary" />
              <span className="font-semibold tracking-tight">Pencil</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              The infinite canvas built for precision. Technical diagrams, system architecture, 
              and visual thought — with AI-powered image generation.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#ai" className="hover:text-foreground transition-colors">AI Generation</a></li>
              <li><a href="#shortcuts" className="hover:text-foreground transition-colors">Shortcuts</a></li>
              <li><a href="#compare" className="hover:text-foreground transition-colors">Why Pencil</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              <li><Link to="/canvas" className="hover:text-foreground transition-colors">Open Canvas</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Pencil. Precision on an infinite scale.
          </span>
          <span className="font-mono-data text-muted-foreground">v1.0</span>
        </div>
      </div>
    </footer>
  );
}
