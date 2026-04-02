import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

export const DownloadZipButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    toast.loading("جاري تجهيز ملفات المشروع...");

    try {
      const zip = new JSZip();
      
      // قائمة بالملفات الأساسية للمشروع
      // ملاحظة: هذه ملفات نموذجية، يمكنك تعديلها حسب احتياجك
      const filesToInclude = {
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
            "sonner": "^1.4.0",
            "jszip": "^3.10.1",
            "file-saver": "^2.0.5"
          }
        }, null, 2),
        
        "README.md": `# AI Site Forge

## مشروع لإنشاء مواقع باستخدام الذكاء الاصطناعي

### التشغيل المحلي:
\`\`\`bash
npm install
npm run dev
\`\`\`

### الميزات:
- React + TypeScript
- React Router للتوجيه
- TanStack Query للبيانات
- Tailwind CSS + shadcn/ui
`,
      };

      // إضافة الملفات إلى الـ ZIP
      for (const [path, content] of Object.entries(filesToInclude)) {
        zip.file(path, content);
      }

      // إنشاء وتنزيل الملف
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, "ai-site-forge.zip");
      
      toast.success("تم تحميل المشروع بنجاح!");
      
    } catch (error) {
      console.error("خطأ في التحميل:", error);
      toast.error("حدث خطأ أثناء تحميل المشروع");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      className="shadow-lg"
      size="default"
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          جاري التجهيز...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          تحميل ZIP
        </>
      )}
    </Button>
  );
};
