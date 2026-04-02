import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DownloadZipButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    toast.loading("جاري تجهيز ملفات المشروع...");

    try {
      // إنشاء محتوى الملفات كنص
      const files = {
        "src/App.tsx": `import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;`,

        "package.json": JSON.stringify({
          name: "ai-site-forge",
          version: "1.0.0",
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc -b && vite build",
            preview: "vite preview"
          },
          dependencies: {
            "@tanstack/react-query": "^5.0.0",
            "react": "^18.3.0",
            "react-dom": "^18.3.0",
            "react-router-dom": "^6.22.0",
            "sonner": "^1.4.0"
          }
        }, null, 2),

        "README.md": `# AI Site Forge

## مشروع لإنشاء مواقع باستخدام الذكاء الاصطناعي

### التشغيل المحلي:
\`\`\`bash
npm install
npm run dev
\`\`\`

### التقنيات المستخدمة:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
`,
        "index.html": `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Site Forge</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      };

      // إنشاء ملف ZIP باستخدام Approach مختلف
      const zipContent = [];
      
      for (const [filename, content] of Object.entries(files)) {
        // ترميز المحتوى لـ URI
        const encodedContent = encodeURIComponent(content);
        zipContent.push(`<file name="${filename}">${encodedContent}</file>`);
      }

      // طريقة بديلة: تنزيل كملف نصي متعدد
      const blob = new Blob(
        [Object.entries(files).map(([name, content]) => 
          `=== FILE: ${name} ===\n${content}\n\n`
        ).join('\n')], 
        { type: 'text/plain' }
      );
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-site-forge-files.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("تم تحميل ملفات المشروع! (ملف نصي)");
      
    } catch (error) {
      console.error("خطأ:", error);
      toast.error("حدث خطأ أثناء تحميل المشروع");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isDownloading}
      className="fixed bottom-4 right-4 z-50 shadow-lg"
    >
      {isDownloading ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          جاري التحميل...
        </>
      ) : (
        <>
          <Download className="ml-2 h-4 w-4" />
          تحميل المشروع
        </>
      )}
    </Button>
  );
};
