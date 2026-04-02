import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportSiteAsZip } from "@/utils/exportSite";
import { toast } from "sonner";

export default function SiteBuilder() {
  const [isExporting, setIsExporting] = useState(false);
  
  // محتوى الموقع الذي أنشأه المستخدم
  const [userSite, setUserSite] = useState({
    name: "موقعي",
    html: `<!DOCTYPE html>
<html lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>موقعي الرائع</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>مرحباً بك في موقعي</h1>
        <p>هذا موقع تم إنشاؤه بواسطة AI Site Forge</p>
        <button id="myButton">اضغط هنا</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
    css: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    text-align: center;
}

h1 {
    color: #667eea;
    margin-bottom: 1rem;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-top: 1rem;
}

button:hover {
    background: #764ba2;
}`,
    js: `document.getElementById('myButton')?.addEventListener('click', () => {
    alert('مرحباً! تم إنشاء هذا الموقع بواسطة الذكاء الاصطناعي');
});`
  });

  const handleExport = async () => {
    if (!userSite.html.trim()) {
      toast.error("لا يوجد محتوى لتصديره!");
      return;
    }
    
    setIsExporting(true);
    try {
      await exportSiteAsZip(userSite);
      toast.success("تم تصدير موقعك بنجاح!");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تصدير الموقع");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
          <h1 className="text-2xl font-bold">🚀 منشئ المواقع بالذكاء الاصطناعي</h1>
          
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="ml-2 h-4 w-4" />
                تحميل الموقع كـ ZIP
              </>
            )}
          </Button>
        </div>
        
        {/* محرر الموقع (مثال بسيط) */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">✏️ محرر HTML</h3>
            <textarea
              value={userSite.html}
              onChange={(e) => setUserSite({...userSite, html: e.target.value})}
              className="w-full h-64 p-2 border rounded font-mono text-sm"
              dir="ltr"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">🎨 محرر CSS</h3>
            <textarea
              value={userSite.css}
              onChange={(e) => setUserSite({...userSite, css: e.target.value})}
              className="w-full h-64 p-2 border rounded font-mono text-sm"
              dir="ltr"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">⚡ محرر JavaScript</h3>
            <textarea
              value={userSite.js}
              onChange={(e) => setUserSite({...userSite, js: e.target.value})}
              className="w-full h-64 p-2 border rounded font-mono text-sm"
              dir="ltr"
            />
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold mb-2">👁️ معاينة الموقع</h3>
            <iframe
              srcDoc={`
                <html>
                  <head><style>${userSite.css}</style></head>
                  <body>${userSite.html}</body>
                  <script>${userSite.js}</script>
                </html>
              `}
              className="w-full h-64 border rounded"
              title="preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
  }
