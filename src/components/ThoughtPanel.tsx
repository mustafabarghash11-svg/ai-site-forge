import { CheckCircle2, Circle, Bookmark } from "lucide-react";
import { ThoughtBlock } from "@/lib/aiService";

interface ThoughtPanelProps {
  thought: ThoughtBlock;
  completedStepIndex: number; // index of last completed step (-1 = none)
  isGenerating: boolean;
}

const ThoughtPanel = ({ thought, completedStepIndex, isGenerating }: ThoughtPanelProps) => {
  return (
    <div className="my-2 rounded-xl border border-border bg-card overflow-hidden w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <span className="text-sm font-medium text-foreground">{thought.title}</span>
        <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-2.5">
        {thought.steps.map((step, i) => {
          const isDone = i <= completedStepIndex;
          const isActive = i === completedStepIndex + 1 && isGenerating;

          return (
            <div key={i} className="flex items-start gap-2.5">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              ) : (
                <Circle
                  className={
                    "w-4 h-4 flex-shrink-0 mt-0.5 " +
                    (isActive ? "text-primary animate-pulse" : "text-muted-foreground/30")
                  }
                />
              )}
              <span
                className={
                  "text-xs leading-relaxed " +
                  (isDone
                    ? "text-muted-foreground line-through decoration-muted-foreground/40"
                    : isActive
                    ? "text-foreground"
                    : "text-muted-foreground/50")
                }
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer tabs */}
      <div className="flex border-t border-border/60">
        <button className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          Details
        </button>
        <div className="w-px bg-border/60" />
        <button className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
          Preview
        </button>
      </div>
    </div>
  );
};

export default ThoughtPanel;
