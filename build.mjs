// Gera index.html (arquivo único, funciona offline) a partir de src/.
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
const r = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2019' });
const js = r.outputFiles[0].text.replace(/<\/script/g, '<\\/script');
writeFileSync('index.html', readFileSync('src/template.html', 'utf8').replace('/*BUNDLE*/', () => js));
console.log('index.html', (js.length / 1024).toFixed(0) + ' KB');
