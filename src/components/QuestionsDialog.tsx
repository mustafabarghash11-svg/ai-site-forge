import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";

export interface AIQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuestionsDialogProps {
  open: boolean;
  questions: AIQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  onClose: () => void;
}

const QuestionsDialog = ({ open, questions, onSubmit, onClose }: QuestionsDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelect = (option: string) => {
    const newAnswers = { ...answers, [current.id]: option };
    setAnswers(newAnswers);

    if (isLast) {
      onSubmit(newAnswers);
      // Reset for next use
      setCurrentIndex(0);
      setAnswers({});
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border-border gap-0 p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground font-medium">
                سؤال {currentIndex + 1} من {questions.length}
              </span>
              {currentIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← رجوع
                </button>
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-foreground leading-relaxed">
              {current.question}
            </DialogTitle>
            <DialogDescription className="sr-only">اختر أحد الخيارات</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {current.options.map((option) => {
              const isSelected = answers[current.id] === option;
              return (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => handleSelect(option)}
                  className={`w-full justify-between text-sm h-auto py-3 px-4 text-right whitespace-normal transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <span className="flex-1 text-right">{option}</span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionsDialog;
