import { readFile, writeFile } from 'node:fs/promises';
const logic = await readFile(new URL('./logic.js', import.meta.url), 'utf8');
const source = await readFile(new URL('./client.source.js', import.meta.url), 'utf8');
if (!source.includes('/*__LOGIC__*/')) throw new Error('Missing client logic placeholder');
await writeFile(new URL('./client.js', import.meta.url), source.replace('/*__LOGIC__*/', () => logic.replace(/^export /gm, '')), 'utf8');
console.log('Built client.js from client.source.js and logic.js');
