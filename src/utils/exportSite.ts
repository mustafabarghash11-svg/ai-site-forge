import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// هذه تمثل الموقع الذي أنشأه المستخدم
interface UserSite {
  html: string;
  css: string;
  js: string;
  name: string;
}

export const exportSiteAsZip = async (site: UserSite) => {
  const zip = new JSZip();
  
  // إضافة ملف HTML
  zip.file("index.html", site.html);
  
  // إضافة ملف CSS
  zip.file("styles.css", site.css);
  
  // إضافة ملف JavaScript
  zip.file("script.js", site.js);
  
  // إضافة ملف README
  zip.file("README.md", `# ${site.name}\n\nتم إنشاء هذا الموقع بواسطة AI Site Forge\n\nتاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}`);
  
  // إنشاء وتحميل الـ ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${site.name}.zip`);
};
