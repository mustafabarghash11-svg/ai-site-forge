import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

declare const JSZip: any; // تعريف JSZip من CDN

export const DownloadZipButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    toast.loading("جاري تجهيز ملفات المشروع...");

    try {
      // تحميل JSZip من CDN إذا لم يكن موجوداً
      if (typeof JSZip === 'undefined') {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const zip = new JSZip();
      
      // نفس الكود السابق لإنشاء الملفات...
      const filesToInclude = {
        "src/App.tsx": `// محتوى ملف App.tsx الخاص بك`,
        "package.json": JSON.stringify({ name: "ai-site-forge", version: "1.0.0" }, null, 2),
        "README.md": "# AI Site Forge\n\nمشروع رائع",
      };

      for (const [path, content] of Object.entries(filesToInclude)) {
        zip.file(path, content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "ai-site-forge.zip";
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("تم تحميل المشروع بنجاح!");
    } catch (error) {
      console.error("خطأ:", error);
      toast.error("حدث خطأ أثناء تحميل المشروع");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isDownloading}>
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
