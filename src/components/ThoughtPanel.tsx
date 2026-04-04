import { useState } from "react";
import { CheckCircle2, Circle, Loader2, ChevronDown, Sparkles } from "lucide-react";
import { ThoughtBlock } from "@/lib/aiService";

interface ThoughtPanelProps {
  thought: ThoughtBlock;
  completedStepIndex: number;
  isGenerating: boolean;
}

const ThoughtPanel = ({ thought, completedStepIndex, isGenerating }: ThoughtPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const allDone = completedStepIndex >= thought.steps.length - 1 && !isGenerating;

  const completedCount = allDone
    ? thought.steps.length
    : Math.min(completedStepIndex, thought.steps.length);

  return (
    <div className="my-2 w-full max-w-sm">
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full group text-left"
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {allDone ? (
            <CheckCircle2 className="w-4 h-4 text-primary" />
          ) : (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}
        </div>

        {/* Title */}
        <span className="text-sm font-medium text-foreground flex-1 truncate">
          {thought.title}
        </span>

        {/* Step counter + chevron */}
        <span className="text-xs text-muted-foreground tabular-nums">
          {completedCount}/{thought.steps.length}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Collapsible steps */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[500px] opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="ml-2 border-l-2 border-border pl-4 space-y-2.5">
          {thought.steps.map((step, i) => {
            const isDone = allDone || i < completedStepIndex;
            const isActive = isGenerating && i === completedStepIndex;
            const isPending = !isDone && !isActive;

            return (
              <div
                key={i}
                className={`flex items-start gap-2.5 transition-all duration-500 ${
                  isPending ? "opacity-40" : "opacity-100"
                }`}
              >
                {/* Step icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Step text */}
                <span
                  className={`text-xs leading-relaxed transition-all duration-300 ${
                    isDone
                      ? "text-muted-foreground line-through"
                      : isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-3 ml-2">
          <div className="h-1 w-full bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${allDone ? 100 : (completedStepIndex / thought.steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThoughtPanel;
