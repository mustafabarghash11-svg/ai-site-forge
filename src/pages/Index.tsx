import { useState, useRef } from "react";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import PreviewPanel from "@/components/PreviewPanel";
import CodePanel, { CodeFile } from "@/components/CodePanel";
import { streamGenerateWebsite } from "@/lib/aiService";
import { Code2, Eye, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [rightPanel, setRightPanel] = useState<"preview" | "code">("preview");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const assistantContentRef = useRef("");

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setIsThinking(true);
    setShowRightPanel(true);
    assistantContentRef.current = "";

    // Build conversation history for context
    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      await streamGenerateWebsite(chatHistory, {
        onThinking: (thinking) => {
          setIsThinking(thinking);
          if (!thinking) {
            // AI started responding, create the assistant message
            const aiMsgId = (Date.now() + 1).toString();
            setMessages((prev) => [
              ...prev,
              { id: aiMsgId, role: "assistant", content: "", timestamp: new Date() },
            ]);
          }
        },
        onTextDelta: (delta) => {
          assistantContentRef.current += delta;
          const currentText = assistantContentRef.current;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: currentText } : m
              );
            }
            return [
              ...prev,
              {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: currentText,
                timestamp: new Date(),
              },
            ];
          });
        },
        onComplete: (result) => {
          if (result.reply) {
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: result.reply } : m
                );
              }
              return [
                ...prev,
                {
                  id: (Date.now() + 1).toString(),
                  role: "assistant",
                  content: result.reply,
                  timestamp: new Date(),
                },
              ];
            });
          }
          if (result.html) {
            setPreviewHtml(result.html);
            setRightPanel("preview");
          }
          if (result.files.length > 0) {
            setCodeFiles(result.files);
          }
          setIsGenerating(false);
          setIsThinking(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
          setIsGenerating(false);
          setIsThinking(false);
        },
      });
    } catch (e) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to AI. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Chat Panel */}
      <div
        className={`flex flex-col border-r border-border transition-all duration-300 ${
          showRightPanel ? "w-[65%]" : "w-full"
        }`}
      >
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          isThinking={isThinking}
        />
      </div>

      {/* Right Panel */}
      {showRightPanel && (
        <div className="flex-1 flex flex-col min-w-0 animate-fade-in">
          <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRightPanel("preview")}
                className={`h-7 text-xs gap-1.5 ${
                  rightPanel === "preview" ? "bg-secondary text-primary" : "text-muted-foreground"
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
                  rightPanel === "code" ? "bg-secondary text-primary" : "text-muted-foreground"
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

          <div className="flex-1 min-h-0">
            {rightPanel === "preview" ? (
              <PreviewPanel html={previewHtml} isGenerating={isGenerating} />
            ) : (
              <CodePanel files={codeFiles} />
            )}
          </div>
        </div>
      )}

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
