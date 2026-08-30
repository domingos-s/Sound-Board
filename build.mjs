import { mkdir, rm, copyFile } from 'node:fs/promises';

const files = ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest'];
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of files) await copyFile(file, `dist/${file}`);
console.log('Built dist/ for Capacitor.');
