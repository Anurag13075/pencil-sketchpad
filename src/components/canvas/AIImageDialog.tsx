import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AIImageDialogProps {
  visible: boolean;
  onClose: () => void;
  onImageGenerated: (imageData: string, width: number, height: number) => void;
}

export function AIImageDialog({ visible, onClose, onImageGenerated }: AIImageDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim() },
      });

      if (fnError) {
        setError(fnError.message || "Failed to generate image");
        setLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      if (data?.imageUrl) {
        // Load the image to get dimensions
        const img = new Image();
        img.onload = () => {
          const maxSize = 400;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxSize || h > maxSize) {
            const scale = maxSize / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }
          onImageGenerated(data.imageUrl, w, h);
          setPrompt("");
          setLoading(false);
        };
        img.onerror = () => {
          setError("Failed to load generated image");
          setLoading(false);
        };
        img.src = data.imageUrl;
      } else {
        setError("No image returned");
        setLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md mx-4 p-6 rounded-2xl border bg-background shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Image Generation</h3>
                <p className="text-xs text-muted-foreground">Describe what you want to create</p>
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cute cat sitting on a laptop, illustration style..."
              className="w-full h-24 px-3 py-2.5 rounded-lg border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/50"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />

            {error && (
              <p className="text-xs text-destructive mt-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full mt-3 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Generate Image
                </>
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
