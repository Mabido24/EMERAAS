import { defineConfig } from 'vite'
import { resolve, dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getHtmlEntries(dir = __dirname, baseDir = __dirname) {
  let entries = {}
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const fullPath = join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'locales' && file !== 'templates' && !file.startsWith('.')) {
        entries = { ...entries, ...getHtmlEntries(fullPath, baseDir) }
      }
    } else if (file.endsWith('.html')) {
      const relPath = relative(baseDir, fullPath)
      const name = relPath.replace(/\.html$/, '').replace(/\\/g, '/')
      entries[name] = fullPath
    }
  })
  return entries
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
})
