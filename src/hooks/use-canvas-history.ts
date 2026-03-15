import { useCallback, useRef, useState } from "react";
import type { CanvasElement } from "@/types/canvas";

export function useCanvasHistory(initialElements: CanvasElement[] = []) {
  const [elements, setElementsState] = useState<CanvasElement[]>(initialElements);
  const historyRef = useRef<CanvasElement[][]>([initialElements]);
  const indexRef = useRef(0);

  const setElements = useCallback(
    (newElements: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
      setElementsState((prev) => {
        const resolved = typeof newElements === "function" ? newElements(prev) : newElements;
        return resolved;
      });
    },
    []
  );

  const commit = useCallback((els: CanvasElement[]) => {
    const next = indexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, next);
    historyRef.current.push(JSON.parse(JSON.stringify(els)));
    indexRef.current = next;
  }, []);

  const undo = useCallback(() => {
    if (indexRef.current > 0) {
      indexRef.current -= 1;
      const snapshot = JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
      setElementsState(snapshot);
      return snapshot;
    }
    return null;
  }, []);

  const redo = useCallback(() => {
    if (indexRef.current < historyRef.current.length - 1) {
      indexRef.current += 1;
      const snapshot = JSON.parse(JSON.stringify(historyRef.current[indexRef.current]));
      setElementsState(snapshot);
      return snapshot;
    }
    return null;
  }, []);

  const canUndo = indexRef.current > 0;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return { elements, setElements, commit, undo, redo, canUndo, canRedo };
}
