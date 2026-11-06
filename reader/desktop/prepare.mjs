// Builds dist/ for the desktop app: the reader page (BUILD='desktop') plus local copies of every library.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist'), lib = join(dist, 'lib'), nm = join(here, 'node_modules');
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(lib, 'hl'), { recursive: true });
const version = JSON.parse(readFileSync(join(here, 'src-tauri', 'tauri.conf.json'), 'utf8')).version;
let ok = false;
for (const py of ['python3', 'python', 'py']) {
  const r = spawnSync(py, [join(here, '..', 'src', 'build.py'), 'desktop', join(dist, 'index.html'), version], { stdio: 'inherit' });
  if (r.status === 0) { ok = true; break; }
}
if (!ok) throw new Error('python build failed');
const copy = (from, to = '') => cpSync(join(nm, from), join(lib, to || from.split('/').pop()), { recursive: true });
copy('pdfjs-dist/build/pdf.min.js'); copy('pdfjs-dist/build/pdf.worker.min.js');
copy('pdfjs-dist/cmaps', 'cmaps'); copy('pdfjs-dist/standard_fonts', 'standard_fonts');
copy('jszip/dist/jszip.min.js'); copy('mammoth/mammoth.browser.min.js'); copy('docx-preview/dist/docx-preview.min.js');
copy('xlsx/dist/xlsx.full.min.js'); copy('marked/marked.min.js'); copy('dompurify/dist/purify.min.js');
copy('@highlightjs/cdn-assets/highlight.min.js'); copy('katex/dist/katex.min.js');
for (const l of ['verilog','vhdl','tcl','matlab','latex','dockerfile','scala','dart','powershell','cmake','protobuf','haskell','elixir','julia','fortran','nginx','groovy','x86asm','armasm','llvm'])
  copy(`@highlightjs/cdn-assets/languages/${l}.min.js`, `hl/${l}.min.js`);
console.log('dist ready, version', version);
