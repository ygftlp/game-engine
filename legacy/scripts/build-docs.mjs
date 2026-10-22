import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import { marked } from 'marked';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(ROOT);
const DOC_ROOT = join(PROJECT_ROOT, 'docs', 'manual');
const ASSET_ROOT = join(DOC_ROOT, 'site-assets');
const OUT_ROOT = join(PROJECT_ROOT, 'dist', 'docs');
const PDF_ROOT = join(OUT_ROOT, 'pdf');

const LOCALES = [
  {
    code: 'zh-CN',
    label: '简体中文',
    heroTitle: '真实能力对齐的 2D 引擎文档',
    heroText: '围绕当前仓库的 TypeScript + Canvas 2D 实现，提供架构、环境、教程、API 与排障手册。',
    pdfTitle: 'Lite Game Engine 技术文档与使用手册',
  },
  {
    code: 'en-US',
    label: 'English',
    heroTitle: 'Production-minded docs for the real 2D engine',
    heroText: 'Architecture, setup, tutorial, API, and troubleshooting for the current TypeScript + Canvas 2D implementation.',
    pdfTitle: 'Lite Game Engine Technical Manual',
  }
];

const PAGES = [
  { slug: 'index', navLabel: { 'zh-CN': '文档总览', 'en-US': 'Overview' } },
  { slug: 'architecture', navLabel: { 'zh-CN': '技术架构', 'en-US': 'Architecture' } },
  { slug: 'setup', navLabel: { 'zh-CN': '环境搭建', 'en-US': 'Setup' } },
  { slug: 'tutorial', navLabel: { 'zh-CN': '基础教程', 'en-US': 'Tutorial' } },
  { slug: 'api', navLabel: { 'zh-CN': 'API 手册', 'en-US': 'API' } },
  { slug: 'faq', navLabel: { 'zh-CN': '常见问题', 'en-US': 'FAQ' } }
];

const FONT_CANDIDATES = {
  regular: [
    'C:\\Windows\\Fonts\\simhei.ttf',
    'C:\\Windows\\Fonts\\hpsimplifiedhans-regular.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\simsunb.ttf',
    '/System/Library/Fonts/PingFang.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
  ],
  mono: [
    'C:\\Windows\\Fonts\\consola.ttf',
    'C:\\Windows\\Fonts\\simhei.ttf',
    '/System/Library/Fonts/Menlo.ttc',
    '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
  ]
};

marked.setOptions({
  gfm: true,
});

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function cleanOutput() {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  ensureDir(OUT_ROOT);
  ensureDir(PDF_ROOT);
  ensureDir(join(OUT_ROOT, 'assets'));
}

function readMarkdown(locale, slug) {
  const filePath = join(DOC_ROOT, locale, `${slug}.md`);
  return readFileSync(filePath, 'utf8');
}

function extractTitle(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, '').trim())
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function copyAssets(searchIndex) {
  copyFileSync(join(ASSET_ROOT, 'style.css'), join(OUT_ROOT, 'assets', 'style.css'));
  copyFileSync(join(ASSET_ROOT, 'app.js'), join(OUT_ROOT, 'assets', 'app.js'));
  writeFileSync(
    join(OUT_ROOT, 'assets', 'search-index.js'),
    `window.__DOCS_SEARCH__ = ${JSON.stringify(searchIndex, null, 2)};\n`,
    'utf8'
  );
}

function navHtml(localeCode, currentSlug) {
  const links = PAGES.map((page) => {
    const href = page.slug === 'index' ? `./index.html` : `./${page.slug}.html`;
    return `<li><a href="${href}"${page.slug === currentSlug ? ' class="is-active"' : ''}>${page.navLabel[localeCode]}</a></li>`;
  }).join('');

  return `
    <div class="rail-section">
      <h2>${localeCode}</h2>
      <ul>${links}</ul>
    </div>
    <div class="rail-section">
      <h3>${localeCode === 'zh-CN' ? '下载' : 'Downloads'}</h3>
      <ul>
        <li><a href="../pdf/${localeCode}-manual.pdf">${localeCode === 'zh-CN' ? 'PDF 手册' : 'PDF manual'}</a></li>
        <li><a class="small" href="../index.html">${localeCode === 'zh-CN' ? '返回首页' : 'Back to home'}</a></li>
      </ul>
    </div>
  `;
}

function topNav(localeCode, currentSlug) {
  return PAGES.map((page) => {
    const href = page.slug === 'index' ? `./index.html` : `./${page.slug}.html`;
    return `<a href="${href}"${page.slug === currentSlug ? ' class="is-active"' : ''}>${page.navLabel[localeCode]}</a>`;
  }).join('');
}

function localeSwitcher(localeCode, currentSlug) {
  const parts = LOCALES.map((locale) => {
    const href = `../${locale.code}/${currentSlug}.html`;
    return `<a href="${href}"${locale.code === localeCode ? ' class="is-active"' : ''}>${locale.label}</a>`;
  });
  return parts.join('');
}

function pageTemplate({ locale, slug, title, contentHtml, description }) {
  return `<!doctype html>
<html lang="${locale.code}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | Lite Game Engine</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="stylesheet" href="../assets/style.css" />
  </head>
  <body>
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <span class="brand-mark"></span>
            <div>
              <div>Lite Game Engine</div>
              <div class="brand-title">${locale.label}</div>
            </div>
          </div>
          <nav class="nav">${topNav(locale.code, slug)}${localeSwitcher(locale.code, slug)}</nav>
        </div>
      </header>
      <section class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">${locale.code}</div>
            <h1>${title}</h1>
            <p>${escapeHtml(description)}</p>
            <div class="hero-actions">
              <a class="button" href="../pdf/${locale.code}-manual.pdf">${locale.code === 'zh-CN' ? '下载 PDF' : 'Download PDF'}</a>
              <a class="button subtle" href="../index.html">${locale.code === 'zh-CN' ? '文档首页' : 'Docs Home'}</a>
            </div>
          </div>
          <div class="hero-meta">
            <div><strong>${locale.code === 'zh-CN' ? '文档格式' : 'Formats'}</strong> HTML / PDF</div>
            <div><strong>${locale.code === 'zh-CN' ? '搜索方式' : 'Search'}</strong> Offline client-side index</div>
            <div><strong>${locale.code === 'zh-CN' ? '适用范围' : 'Scope'}</strong> H5 / WeChat / Douyin 2D runtime</div>
          </div>
        </div>
      </section>
      <main class="layout">
        <aside class="rail">${navHtml(locale.code, slug)}</aside>
        <section class="content-wrap">
          <div class="search">
            <input data-search-input placeholder="${locale.code === 'zh-CN' ? '搜索文档关键字...' : 'Search docs...'}" />
            <div data-search-panel class="search-panel"></div>
          </div>
          <article class="content">${contentHtml}</article>
        </section>
      </main>
      <footer class="footer">
        <div class="footer-inner">
          <div>Lite Game Engine Manual</div>
          <div>${locale.code === 'zh-CN' ? '由 Markdown 构建为静态站点与 PDF' : 'Generated from Markdown into static HTML and PDF'}</div>
        </div>
      </footer>
    </div>
    <script>window.__DOCS_BASE__ = '../';</script>
    <script src="../assets/search-index.js"></script>
    <script src="../assets/app.js"></script>
  </body>
</html>`;
}

function homeTemplate(searchIndex) {
  const localeSections = LOCALES.map((locale) => {
    const docLinks = PAGES.map((page) => {
      const href = `${locale.code}/${page.slug}.html`;
      return `<a href="${href}"><strong>${page.navLabel[locale.code]}</strong><span>${locale.label}</span></a>`;
    }).join('');

    return `
      <section class="home-section">
        <div class="eyebrow">${locale.code}</div>
        <h2>${locale.heroTitle}</h2>
        <p>${locale.heroText}</p>
        <div class="hero-actions">
          <a class="button" href="pdf/${locale.code}-manual.pdf">${locale.code === 'zh-CN' ? '下载 PDF' : 'Download PDF'}</a>
          <a class="button subtle" href="${locale.code}/index.html">${locale.code === 'zh-CN' ? '进入文档' : 'Open docs'}</a>
        </div>
        <div class="home-grid">${docLinks}</div>
      </section>
    `;
  }).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Lite Game Engine Docs</title>
    <meta name="description" content="Bilingual technical manual for the current Lite Game Engine implementation." />
    <link rel="stylesheet" href="./assets/style.css" />
  </head>
  <body>
    <div class="shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <span class="brand-mark"></span>
            <div>
              <div>Lite Game Engine</div>
              <div class="brand-title">Documentation Portal</div>
            </div>
          </div>
          <nav class="nav">
            <a href="./zh-CN/index.html">简体中文</a>
            <a href="./en-US/index.html">English</a>
          </nav>
        </div>
      </header>
      <section class="hero">
        <div class="hero-inner">
          <div>
            <div class="eyebrow">Manual Suite</div>
            <h1>One source of truth for the real engine.</h1>
            <p>The manual is aligned with the repository as it exists today: a lightweight TypeScript + Canvas 2D engine for H5, WeChat Mini Games, and Douyin Mini Games.</p>
            <div class="hero-actions">
              <a class="button" href="./zh-CN/index.html">Open Chinese Docs</a>
              <a class="button subtle" href="./en-US/index.html">Open English Docs</a>
            </div>
          </div>
          <div class="hero-meta">
            <div><strong>Deliverables</strong> Markdown / HTML / PDF</div>
            <div><strong>Search</strong> Offline index with in-page results</div>
            <div><strong>Example</strong> examples/manual-starter</div>
          </div>
        </div>
      </section>
      <main class="layout">
        <aside class="rail">
          <div class="rail-section">
            <h2>Search</h2>
            <div class="search">
              <input data-search-input placeholder="Search docs..." />
              <div data-search-panel class="search-panel"></div>
            </div>
          </div>
          <div class="rail-section">
            <h3>Outputs</h3>
            <ul>
              <li><a href="./zh-CN/index.html">HTML / zh-CN</a></li>
              <li><a href="./en-US/index.html">HTML / en-US</a></li>
              <li><a href="./pdf/zh-CN-manual.pdf">PDF / zh-CN</a></li>
              <li><a href="./pdf/en-US-manual.pdf">PDF / en-US</a></li>
            </ul>
          </div>
        </aside>
        <section class="content-wrap">
          <div class="content">
            <div class="home-sections">${localeSections}</div>
          </div>
        </section>
      </main>
      <footer class="footer">
        <div class="footer-inner">
          <div>Lite Game Engine Docs</div>
          <div>${searchIndex.length} indexed entries</div>
        </div>
      </footer>
    </div>
    <script>window.__DOCS_BASE__ = './';</script>
    <script src="./assets/search-index.js"></script>
    <script src="./assets/app.js"></script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function firstParagraph(markdown) {
  const lines = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  return lines[0] ?? '';
}

function pickFont(candidates) {
  return candidates.find((file) => existsSync(file)) ?? null;
}

function inlineText(value) {
  return value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function writePdf(locale, docs) {
  return new Promise((resolvePromise, rejectPromise) => {
    const regularFont = pickFont(FONT_CANDIDATES.regular);
    const monoFont = pickFont(FONT_CANDIDATES.mono) ?? regularFont;
    const output = join(PDF_ROOT, `${locale.code}-manual.pdf`);
    const doc = new PDFDocument({
      autoFirstPage: false,
      size: 'A4',
      margins: { top: 52, right: 52, bottom: 52, left: 52 }
    });
    writePdfStream(doc, output, resolvePromise, rejectPromise);

    if (regularFont) {
      doc.registerFont('manual-regular', regularFont);
      doc.font('manual-regular');
    }

    if (monoFont) {
      doc.registerFont('manual-mono', monoFont);
    }

    doc.addPage();
    doc.fontSize(24).fillColor('#0b1328').text(locale.pdfTitle);
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#42526b').text(`Locale: ${locale.code}`);
    doc.moveDown();
    doc.text(locale.heroText);

    for (const page of docs) {
      doc.addPage();
      renderMarkdownPage(doc, page, { regularFont: Boolean(regularFont), monoFont: Boolean(monoFont) });
    }

    doc.end();
  });
}

function writePdfStream(doc, output, resolvePromise, rejectPromise) {
  ensureDir(dirname(output));
  const stream = doc.pipe(createWriteStream(output));
  stream.on('finish', resolvePromise);
  stream.on('error', rejectPromise);
  return stream;
}

function setRegular(doc, fonts) {
  if (fonts.regularFont) {
    doc.font('manual-regular');
  } else {
    doc.font('Helvetica');
  }
}

function setMono(doc, fonts) {
  if (fonts.monoFont) {
    doc.font('manual-mono');
  } else {
    doc.font('Courier');
  }
}

function ensurePageSpace(doc, height) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + height > bottom) {
    doc.addPage();
  }
}

function renderParagraph(doc, text, fonts) {
  if (!text) return;
  setRegular(doc, fonts);
  doc.fontSize(11).fillColor('#0f172a').text(text, { lineGap: 4 });
  doc.moveDown(0.5);
}

function renderMarkdownPage(doc, page, fonts) {
  const lines = page.source.split('\n');
  const paragraph = [];
  let inCode = false;
  let codeBuffer = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    renderParagraph(doc, inlineText(paragraph.join(' ')), fonts);
    paragraph.length = 0;
  };

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    ensurePageSpace(doc, 60);
    setMono(doc, fonts);
    doc.fontSize(9).fillColor('#111827').text(codeBuffer.join('\n'), {
      lineGap: 2,
      paragraphGap: 0
    });
    doc.moveDown();
    codeBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      inCode = !inCode;
      if (!inCode) flushCode();
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushParagraph();
      ensurePageSpace(doc, 42);
      setRegular(doc, fonts);
      doc.fontSize(22).fillColor('#020617').text(inlineText(trimmed.slice(2)));
      doc.moveDown(0.6);
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushParagraph();
      ensurePageSpace(doc, 34);
      setRegular(doc, fonts);
      doc.fontSize(18).fillColor('#020617').text(inlineText(trimmed.slice(3)));
      doc.moveDown(0.4);
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushParagraph();
      ensurePageSpace(doc, 28);
      setRegular(doc, fonts);
      doc.fontSize(14).fillColor('#111827').text(inlineText(trimmed.slice(4)));
      doc.moveDown(0.3);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      renderParagraph(doc, `- ${inlineText(trimmed.replace(/^[-*]\s+/, ''))}`, fonts);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      renderParagraph(doc, inlineText(trimmed), fonts);
      continue;
    }

    if (/^\|/.test(trimmed)) {
      flushParagraph();
      if (/^(\|\s*[-:]+\s*)+\|?$/.test(trimmed)) continue;
      setMono(doc, fonts);
      doc.fontSize(9).fillColor('#334155').text(trimmed.replace(/\|/g, '  '), { lineGap: 1 });
      doc.moveDown(0.4);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushCode();
}

async function main() {
  cleanOutput();

  const pageCache = [];
  const searchIndex = [];

  for (const locale of LOCALES) {
    const localeOutDir = join(OUT_ROOT, locale.code);
    ensureDir(localeOutDir);

    for (const page of PAGES) {
      const source = readMarkdown(locale.code, page.slug);
      const title = extractTitle(source);
      const description = firstParagraph(source);
      const html = marked.parse(source);
      const output = join(localeOutDir, `${page.slug}.html`);

      pageCache.push({ locale, page, source, title, description });
      searchIndex.push({
        locale: locale.code,
        title,
        path: `${locale.code}/${page.slug}.html`,
        text: stripMarkdown(source)
      });

      writeFileSync(
        output,
        pageTemplate({
          locale,
          slug: page.slug,
          title,
          contentHtml: html,
          description
        }),
        'utf8'
      );
    }
  }

  copyAssets(searchIndex);
  writeFileSync(join(OUT_ROOT, 'index.html'), homeTemplate(searchIndex), 'utf8');

  for (const locale of LOCALES) {
    const docs = pageCache.filter((entry) => entry.locale.code === locale.code);
    await writePdf(locale, docs);
  }

  console.log('[docs] generated static site and pdf manuals -> dist/docs');
}

main().catch((error) => {
  console.error('[docs] build failed');
  console.error(error);
  process.exitCode = 1;
});
