import { useState } from "react";
import { Copy, Check, FileCode2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

interface CodePanelProps {
  files: CodeFile[];
}

const languageColors: Record<string, string> = {
  html: "text-orange-400",
  css: "text-blue-400",
  javascript: "text-yellow-400",
  typescript: "text-blue-500",
  jsx: "text-cyan-400",
  tsx: "text-cyan-400",
  json: "text-green-400",
};

const CodePanel = ({ files }: CodePanelProps) => {
  const [activeFile, setActiveFile] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (files[activeFile]) {
      navigator.clipboard.writeText(files[activeFile].content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col h-full border-t border-border">
      {/* File tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-card border-b border-border overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={file.name}
            onClick={() => setActiveFile(idx)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
              idx === activeFile
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode2 className={`w-3 h-3 ${languageColors[file.language] || "text-muted-foreground"}`} />
            {file.name}
          </button>
        ))}
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-muted-foreground">
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto p-4 bg-background">
        <pre className="text-xs leading-relaxed font-mono text-foreground/90">
          <code>{files[activeFile]?.content}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
