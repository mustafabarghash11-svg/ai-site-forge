import { CheckCircle2, Circle, Loader2, Bookmark } from "lucide-react";
import { ThoughtBlock } from "@/lib/aiService";

interface ThoughtPanelProps {
  thought: ThoughtBlock;
  completedStepIndex: number;
  isGenerating: boolean;
}

const ThoughtPanel = ({ thought, completedStepIndex, isGenerating }: ThoughtPanelProps) => {
  const allDone = completedStepIndex >= thought.steps.length - 1 && !isGenerating;

  return (
    <div className="my-2 rounded-xl border border-border bg-card overflow-hidden w-full max-w-xs shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold text-foreground leading-snug pr-2">
          {thought.title}
        </span>
        <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-50" />
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-0" />

      {/* Steps */}
      <div className="px-4 py-3 space-y-3">
        {thought.steps.map((step, i) => {
          const isDone = i <= completedStepIndex && !isGenerating ? true : i < completedStepIndex;
          const isCurrentlyActive =
            isGenerating && i === completedStepIndex;
          const isPending = !isDone && !isCurrentlyActive;

          return (
            <div key={i} className="flex items-center gap-2.5">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-70" />
              ) : isCurrentlyActive ? (
                <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
              )}
              <span
                className={
                  "text-xs leading-relaxed transition-colors duration-300 " +
                  (isDone
                    ? "text-muted-foreground/60 line-through"
                    : isCurrentlyActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground/40")
                }
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-0" />

      {/* Footer tabs */}
      <div className="flex">
        <button className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Details
        </button>
        <div className="w-px bg-border" />
        <button className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          Preview
        </button>
      </div>
    </div>
  );
};

export default ThoughtPanel;
