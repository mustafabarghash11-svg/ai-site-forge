import { useState } from "react";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel, { CodeFile } from "@/components/CodePanel";
import { generateWebsite } from "@/lib/mockAI";
import { Code2, Eye, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [rightPanel, setRightPanel] = useState<"preview" | "code">("preview");
  const [showRightPanel, setShowRightPanel] = useState(true);

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setShowRightPanel(true);

    try {
      const result = await generateWebsite(content);
      setPreviewHtml(result.html);
      setCodeFiles(result.files);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat Panel - Left */}
      <div
        className={`flex flex-col border-r border-border transition-all duration-300 ${
          showRightPanel ? "w-[65%]" : "w-full"
        }`}
      >
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
        />
      </div>

      {/* Right Panel - Preview/Code */}
      {showRightPanel && (
        <div className="flex-1 flex flex-col min-w-0 animate-fade-in">
          {/* Panel switcher tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanel("preview")}
                className={`h-7 text-xs gap-1.5 ${
                  rightPanel === "preview"
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanel("code")}
                className={`h-7 text-xs gap-1.5 ${
                  rightPanel === "code"
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRightPanel(false)}
              className="h-7 w-7 p-0 text-muted-foreground"
            >
              <PanelRightOpen className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Panel content */}
          <div className="flex-1 min-h-0">
            {rightPanel === "preview" ? (
              <PreviewPanel html={previewHtml} isGenerating={isGenerating} />
            ) : (
              <CodePanel files={codeFiles} />
            )}
          </div>
        </div>
      )}

      {/* Toggle panel button when hidden */}
      {!showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-4 top-4 z-50 p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Index;
