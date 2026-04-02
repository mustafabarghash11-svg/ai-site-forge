import { useState } from "react";
import { ZoomIn, ZoomOut, Monitor, Smartphone, Tablet, RotateCcw, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  html: string;
  isGenerating: boolean;
}

const PreviewPanel = ({ html, isGenerating }: PreviewPanelProps) => {
  const [zoom, setZoom] = useState(100);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const deviceWidths = { desktop: "100%", tablet: "768px", mobile: "375px" };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 25));
  const handleReset = () => { setZoom(100); setDevice("desktop"); };

  const fullHtml = html || `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#09090b;color:#71717a;font-family:Inter,sans-serif;">
      <div style="text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">🚀</div>
        <p style="font-size:14px;">Your website preview will appear here</p>
      </div>
    </div>
  `;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as const).map((d) => {
            const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return (
              <Button
                key={d}
                variant="ghost"
                size="sm"
                onClick={() => setDevice(d)}
                className={`h-7 w-7 p-0 ${device === d ? "bg-secondary text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground font-mono">{zoom}%</span>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0 text-muted-foreground">
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0 text-muted-foreground">
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0 text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 bg-background flex justify-center">
        <div
          className="relative transition-all duration-300 border border-border rounded-lg overflow-hidden bg-foreground/5"
          style={{
            width: deviceWidths[device],
            maxWidth: "100%",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
            height: "fit-content",
            minHeight: zoom < 100 ? `${100 / (zoom / 100)}%` : "100%",
          }}
        >
          {isGenerating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground">Building...</p>
              </div>
            </div>
          )}
          <iframe
            srcDoc={fullHtml}
            className="w-full border-0"
            style={{ minHeight: "600px", height: "100%" }}
            title="Website Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
