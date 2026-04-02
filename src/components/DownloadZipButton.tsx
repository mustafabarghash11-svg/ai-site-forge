import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DownloadZipButton = () => {
  const handleDownload = async () => {
    const zip = new JSZip();
    
    // إضافة مجلد src كاملاً (مثال)
    const srcFiles = import.meta.glob('/src/**/*', { 
      eager: true, 
      as: 'raw' 
    });
    
    for (const [path, content] of Object.entries(srcFiles)) {
      // إزالة الجزء '/src/' من المسار
      const relativePath = path.replace('/src/', '');
      zip.file(relativePath, content as string);
    }
    
    // إضافة الملفات الأخرى (public, index.html, package.json...)
    const rootFiles = ['package.json', 'index.html', 'README.md'];
    // ... أضف باقي الملفات بنفس الطريقة
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'ai-site-forge.zip');
  };

  return (
    <button 
      onClick={handleDownload}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      📥 تحميل المشروع كـ ZIP
    </button>
  );
};

export default DownloadZipButton;
