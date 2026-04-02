import { CodeFile } from "@/components/CodePanel";

interface GenerationResult {
  reply: string;
  html: string;
  files: CodeFile[];
}

const templates: Record<string, GenerationResult> = {
  portfolio: {
    reply: "I've created a modern portfolio website with a dark theme, smooth animations, and responsive design. It includes:\n\n✅ Hero section with animated gradient\n✅ Projects grid with hover effects\n✅ Skills section\n✅ Contact form\n\nYou can see the preview on the right. Want me to modify anything?",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Portfolio</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#09090b;color:#fafafa;overflow-x:hidden}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;width:600px;height:600px;background:radial-gradient(circle,rgba(6,182,212,0.15),transparent 70%);top:-100px;right:-100px;border-radius:50%}
.hero h1{font-size:4rem;font-weight:700;background:linear-gradient(135deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem}
.hero p{font-size:1.25rem;color:#a1a1aa;max-width:500px;margin:0 auto 2rem}
.btn{display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#09090b;border-radius:12px;text-decoration:none;font-weight:600;font-size:0.9rem;transition:transform 0.2s,box-shadow 0.2s}
.btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(6,182,212,0.3)}
.projects{padding:80px 40px;max-width:1200px;margin:0 auto}
.projects h2{font-size:2rem;margin-bottom:40px;text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.card{background:#18181b;border:1px solid #27272a;border-radius:16px;padding:24px;transition:border-color 0.3s,transform 0.2s}
.card:hover{border-color:#06b6d4;transform:translateY(-4px)}
.card h3{font-size:1.1rem;margin-bottom:8px}
.card p{color:#a1a1aa;font-size:0.875rem;line-height:1.6}
.tag{display:inline-block;padding:4px 10px;background:#27272a;border-radius:6px;font-size:0.75rem;color:#06b6d4;margin-top:12px;margin-right:6px}
</style>
</head>
<body>
<section class="hero">
  <div>
    <h1>John Developer</h1>
    <p>Full-stack developer crafting beautiful digital experiences with modern technologies.</p>
    <a href="#projects" class="btn">View Projects</a>
  </div>
</section>
<section class="projects" id="projects">
  <h2>Featured Projects</h2>
  <div class="grid">
    <div class="card">
      <h3>E-Commerce Platform</h3>
      <p>A full-featured online store with cart, checkout, and payment integration.</p>
      <span class="tag">React</span><span class="tag">Node.js</span><span class="tag">Stripe</span>
    </div>
    <div class="card">
      <h3>Task Management App</h3>
      <p>Real-time collaborative task manager with drag-and-drop functionality.</p>
      <span class="tag">TypeScript</span><span class="tag">PostgreSQL</span>
    </div>
    <div class="card">
      <h3>AI Chat Assistant</h3>
      <p>An intelligent chatbot powered by machine learning for customer support.</p>
      <span class="tag">Python</span><span class="tag">OpenAI</span><span class="tag">FastAPI</span>
    </div>
  </div>
</section>
</body>
</html>`,
    files: [
      { name: "index.html", language: "html", content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Portfolio</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <section class="hero">\n    <h1>John Developer</h1>\n    <p>Full-stack developer</p>\n    <a href="#projects" class="btn">View Projects</a>\n  </section>\n  <section id="projects" class="projects">\n    <h2>Featured Projects</h2>\n    <div class="grid">...</div>\n  </section>\n</body>\n</html>` },
      { name: "style.css", language: "css", content: `* { margin: 0; padding: 0; box-sizing: border-box; }\nbody {\n  font-family: 'Inter', sans-serif;\n  background: #09090b;\n  color: #fafafa;\n}\n.hero {\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.hero h1 {\n  font-size: 4rem;\n  background: linear-gradient(135deg, #06b6d4, #3b82f6);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n.btn {\n  padding: 12px 32px;\n  background: linear-gradient(135deg, #06b6d4, #3b82f6);\n  border-radius: 12px;\n  color: #09090b;\n  font-weight: 600;\n}` },
      { name: "vite.config.ts", language: "typescript", content: `import { defineConfig } from 'vite';\n\nexport default defineConfig({\n  root: '.',\n  build: {\n    outDir: 'dist',\n  },\n  server: {\n    port: 3000,\n  },\n});` },
    ],
  },
  ecommerce: {
    reply: "I've built a stunning e-commerce landing page! It features:\n\n✅ Hero banner with CTA\n✅ Product cards with pricing\n✅ Shopping cart indicator\n✅ Responsive grid layout\n\nWant me to add a database for product management?",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ShopNow</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#09090b;color:#fafafa}
nav{display:flex;justify-content:space-between;align-items:center;padding:20px 40px;border-bottom:1px solid #27272a}
nav h1{font-size:1.5rem;font-weight:700;color:#06b6d4}
.cart-btn{padding:8px 20px;background:#27272a;border-radius:8px;color:#fafafa;border:none;cursor:pointer;font-size:0.85rem}
.hero-shop{padding:80px 40px;text-align:center;background:linear-gradient(180deg,#0a1628,#09090b)}
.hero-shop h2{font-size:3rem;font-weight:700;margin-bottom:1rem}
.hero-shop h2 span{color:#06b6d4}
.hero-shop p{color:#a1a1aa;font-size:1.1rem;margin-bottom:2rem}
.products{padding:60px 40px;max-width:1200px;margin:0 auto}
.products h3{font-size:1.5rem;margin-bottom:32px;text-align:center}
.product-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}
.product{background:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;transition:transform 0.2s}
.product:hover{transform:translateY(-4px)}
.product-img{height:200px;background:linear-gradient(135deg,#1e293b,#0f172a);display:flex;align-items:center;justify-content:center;font-size:3rem}
.product-info{padding:20px}
.product-info h4{font-size:1rem;margin-bottom:4px}
.product-info .price{color:#06b6d4;font-weight:700;font-size:1.25rem;margin-bottom:12px}
.add-btn{width:100%;padding:10px;background:#06b6d4;color:#09090b;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background 0.2s}
.add-btn:hover{background:#0891b2}
</style>
</head>
<body>
<nav><h1>ShopNow</h1><button class="cart-btn">🛒 Cart (0)</button></nav>
<section class="hero-shop">
  <h2>Discover <span>Premium</span> Products</h2>
  <p>Curated collection of the finest items, delivered to your door.</p>
</section>
<section class="products">
  <h3>Trending Now</h3>
  <div class="product-grid">
    <div class="product"><div class="product-img">👟</div><div class="product-info"><h4>Premium Sneakers</h4><p class="price">$129.99</p><button class="add-btn">Add to Cart</button></div></div>
    <div class="product"><div class="product-img">⌚</div><div class="product-info"><h4>Smart Watch Pro</h4><p class="price">$299.99</p><button class="add-btn">Add to Cart</button></div></div>
    <div class="product"><div class="product-img">🎧</div><div class="product-info"><h4>Wireless Headphones</h4><p class="price">$89.99</p><button class="add-btn">Add to Cart</button></div></div>
    <div class="product"><div class="product-img">💻</div><div class="product-info"><h4>Laptop Stand</h4><p class="price">$49.99</p><button class="add-btn">Add to Cart</button></div></div>
  </div>
</section>
</body>
</html>`,
    files: [
      { name: "index.html", language: "html", content: `<!-- E-commerce landing page HTML -->` },
      { name: "style.css", language: "css", content: `/* E-commerce styles */` },
      { name: "app.js", language: "javascript", content: `// Cart functionality\nlet cart = [];\n\nfunction addToCart(product) {\n  cart.push(product);\n  updateCartUI();\n}\n\nfunction updateCartUI() {\n  document.querySelector('.cart-btn').textContent = \`🛒 Cart (\${cart.length})\`;\n}` },
    ],
  },
  dashboard: {
    reply: "Here's your SaaS dashboard! Features include:\n\n✅ Sidebar navigation\n✅ Stats cards with metrics\n✅ Revenue chart area\n✅ Recent activity feed\n\nI can add a database connection for real-time data. Want that?",
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#09090b;color:#fafafa;display:flex;height:100vh}
.sidebar{width:240px;background:#18181b;border-right:1px solid #27272a;padding:24px 16px;display:flex;flex-direction:column;gap:4px}
.sidebar h2{font-size:1.2rem;color:#06b6d4;margin-bottom:24px;padding:0 8px}
.nav-item{padding:10px 12px;border-radius:8px;font-size:0.875rem;color:#a1a1aa;cursor:pointer;transition:all 0.2s}
.nav-item:hover,.nav-item.active{background:#27272a;color:#fafafa}
.nav-item.active{color:#06b6d4}
.main{flex:1;overflow-y:auto;padding:32px}
.main h1{font-size:1.75rem;font-weight:700;margin-bottom:24px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px}
.stat{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:20px}
.stat .label{font-size:0.75rem;color:#a1a1aa;margin-bottom:4px}
.stat .value{font-size:1.75rem;font-weight:700}
.stat .change{font-size:0.75rem;color:#22c55e;margin-top:4px}
.chart-area{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px;height:300px;display:flex;align-items:center;justify-content:center;color:#a1a1aa;margin-bottom:24px}
.activity{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px}
.activity h3{margin-bottom:16px}
.activity-item{padding:12px 0;border-bottom:1px solid #27272a;font-size:0.875rem;color:#a1a1aa}
.activity-item:last-child{border-bottom:none}
</style>
</head>
<body>
<aside class="sidebar">
  <h2>⚡ Dashboard</h2>
  <div class="nav-item active">📊 Overview</div>
  <div class="nav-item">👥 Users</div>
  <div class="nav-item">💰 Revenue</div>
  <div class="nav-item">📦 Products</div>
  <div class="nav-item">⚙️ Settings</div>
</aside>
<main class="main">
  <h1>Overview</h1>
  <div class="stats">
    <div class="stat"><div class="label">Total Revenue</div><div class="value">$45,231</div><div class="change">↑ 20.1%</div></div>
    <div class="stat"><div class="label">Active Users</div><div class="value">2,350</div><div class="change">↑ 12.5%</div></div>
    <div class="stat"><div class="label">Sales</div><div class="value">1,247</div><div class="change">↑ 8.2%</div></div>
    <div class="stat"><div class="label">Conversion</div><div class="value">3.2%</div><div class="change">↑ 1.1%</div></div>
  </div>
  <div class="chart-area">📈 Revenue Chart (Interactive chart would render here)</div>
  <div class="activity">
    <h3>Recent Activity</h3>
    <div class="activity-item">🟢 New user registered — 2 min ago</div>
    <div class="activity-item">💳 Payment received $99.00 — 15 min ago</div>
    <div class="activity-item">📦 Order #1234 shipped — 1 hour ago</div>
    <div class="activity-item">⚡ Server scaled up — 3 hours ago</div>
  </div>
</main>
</body>
</html>`,
    files: [
      { name: "index.html", language: "html", content: `<!-- Dashboard HTML -->` },
      { name: "style.css", language: "css", content: `/* Dashboard styles */` },
      { name: "app.tsx", language: "tsx", content: `import React from 'react';\n\nconst Dashboard = () => {\n  return <div>Dashboard Component</div>;\n};\n\nexport default Dashboard;` },
      { name: "vite.config.ts", language: "typescript", content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});` },
    ],
  },
};

export function generateWebsite(prompt: string): Promise<GenerationResult> {
  return new Promise((resolve) => {
    const lower = prompt.toLowerCase();
    let result: GenerationResult;

    if (lower.includes("portfolio") || lower.includes("personal")) {
      result = templates.portfolio;
    } else if (lower.includes("shop") || lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("store")) {
      result = templates.ecommerce;
    } else if (lower.includes("dashboard") || lower.includes("saas") || lower.includes("admin")) {
      result = templates.dashboard;
    } else {
      // Default: generate a generic landing page
      result = {
        reply: `I've created a website based on your description! Here's what I built:\n\n✅ Clean, modern layout\n✅ Responsive design\n✅ Dark theme with accent colors\n✅ Ready for customization\n\nWant me to add more features or change the design?`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Generated Website</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#09090b;color:#fafafa}
.container{max-width:800px;margin:0 auto;padding:80px 40px;text-align:center}
h1{font-size:3rem;font-weight:700;background:linear-gradient(135deg,#06b6d4,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:1rem}
p{color:#a1a1aa;font-size:1.1rem;line-height:1.8;margin-bottom:2rem}
.cta{display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:#09090b;border-radius:12px;text-decoration:none;font-weight:600;transition:transform 0.2s}
.cta:hover{transform:translateY(-2px)}
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;margin-top:60px;text-align:left}
.feature{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:24px}
.feature h3{font-size:1rem;margin-bottom:8px;color:#06b6d4}
.feature p{font-size:0.875rem;color:#a1a1aa}
</style>
</head>
<body>
<div class="container">
  <h1>Your Website</h1>
  <p>Built with AI, customized for you. This is your starting point — tell me what to change!</p>
  <a href="#" class="cta">Get Started</a>
  <div class="features">
    <div class="feature"><h3>⚡ Fast</h3><p>Optimized for speed and performance.</p></div>
    <div class="feature"><h3>📱 Responsive</h3><p>Looks great on any device.</p></div>
    <div class="feature"><h3>🎨 Customizable</h3><p>Easy to modify and extend.</p></div>
  </div>
</div>
</body>
</html>`,
        files: [
          { name: "index.html", language: "html", content: `<!-- Your generated website -->` },
          { name: "style.css", language: "css", content: `/* Generated styles */` },
        ],
      };
    }

    // Simulate AI generation delay
    setTimeout(() => resolve(result), 2000 + Math.random() * 1500);
  });
}
