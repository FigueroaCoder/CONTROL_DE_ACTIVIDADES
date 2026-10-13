/* ===================================================================
   Generador del index.html publicado
   Uso (dentro de la carpeta fuente/):   npm install   y luego   npm run build

   Lee plantilla.html + styles.css + los .js y produce:
     - fuente/index.fuente.html  → versión legible (para depurar en tu equipo)
     - ../index.html             → versión publicada: CSS minificado, JavaScript
                                   ofuscado (nombres y textos ilegibles), HTML comprimido,
                                   política de seguridad (CSP) y protecciones de guard.js
   =================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import CleanCSS from 'clean-css';
import JavaScriptObfuscator from 'javascript-obfuscator';
import {minify as minHtml} from 'html-minifier-terser';

const dir = path.dirname(fileURLToPath(import.meta.url));
const leer = f => fs.readFileSync(path.join(dir, f), 'utf8').trim();

/* Orden de carga: igual que antes (los .js clásicos comparten el mismo ámbito global) */
const CLASICOS = ['store', 'ui', 'dashboard', 'tickets', 'puntos', 'usuarios', 'chat', 'reportero', 'app'];
const MODULO = 'firebase';

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com; frame-src https://*.firebaseapp.com; object-src 'none'; base-uri 'self'; form-action 'none'";

const plantilla = leer('plantilla.html');
const css = leer('styles.css');

/* ---------- 1) Versión legible ---------- */
const legible = plantilla
  .replace('<!--@SEGURIDAD-->', '')
  .replace('<!--@CSS-->', () => `<style>\n${css}\n</style>`)
  .replace('<!--@JS-->', () => CLASICOS.map(f => `<script>\n${leer(f + '.js')}\n</script>`).join('\n') + `\n<script type="module">\n${leer(MODULO + '.js')}\n</script>`);
fs.writeFileSync(path.join(dir, 'index.fuente.html'), legible + '\n');

/* ---------- 2) Versión publicada ---------- */
const OBF = {
  target: 'browser',
  compact: true,
  simplify: true,
  renameGlobals: false,            /* los onclick="..." del HTML llaman funciones globales por nombre */
  renameProperties: false,
  identifierNamesGenerator: 'hexadecimal',
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.8,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'function',
  splitStrings: false,
  controlFlowFlattening: false,    /* se mantiene rápido */
  deadCodeInjection: false,
  selfDefending: false,
  debugProtection: false,
  disableConsoleOutput: false,
  unicodeEscapeSequence: false
};
const ofusca = (codigo, extra = {}) => JavaScriptObfuscator.obfuscate(codigo, {...OBF, ...extra}).getObfuscatedCode();

const jsClasico = ofusca(CLASICOS.map(f => leer(f + '.js')).join('\n;\n'), {sourceType: 'script'});
const jsModulo = ofusca(leer(MODULO + '.js'), {sourceType: 'module'});
const cssMin = new CleanCSS({level: 1}).minify(css).styles;

const seguridad =
  `<meta http-equiv="Content-Security-Policy" content="${CSP}">\n` +
  `<meta name="referrer" content="no-referrer">\n<meta name="robots" content="noindex,nofollow">\n` +
  `<script>${ofusca(leer('guard.js'), {sourceType: 'script'})}</script>`;

let pub = plantilla
  .replace('<!--@SEGURIDAD-->', () => seguridad)
  .replace('<!--@CSS-->', () => `<style>${cssMin}</style>`)
  .replace('<!--@JS-->', () => `<script>${jsClasico}</script>\n<script type="module">${jsModulo}</script>`);

pub = await minHtml(pub, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  removeComments: true,
  minifyCSS: false,
  minifyJS: false
});

const salida = path.join(dir, '..', 'index.html');
fs.writeFileSync(salida, pub);
const kb = n => (n / 1024).toFixed(1) + ' KB';
console.log('index.fuente.html', kb(Buffer.byteLength(legible)));
console.log('index.html       ', kb(Buffer.byteLength(pub)), '→', salida);
