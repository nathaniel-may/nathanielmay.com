import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const maximumBytes = 6 * 1024 * 1024;

async function directorySize(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? directorySize(path) : (await stat(path)).size;
    })
  );
  return sizes.reduce((total, size) => total + size, 0);
}

const bytes = await directorySize(distDirectory);
const mebibytes = (bytes / 1024 / 1024).toFixed(2);

if (bytes > maximumBytes) {
  throw new Error(`dist is ${mebibytes} MiB, exceeding the 6 MiB budget`);
}

console.log(`dist is ${mebibytes} MiB (6 MiB budget)`);
