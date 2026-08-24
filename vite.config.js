import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

function getHtmlEntries() {
  const entries = {}
  const files = fs.readdirSync(__dirname)
  files.forEach((file) => {
    if (file.endsWith('.html')) {
      const name = file.replace(/\.html$/, '')
      entries[name] = resolve(__dirname, file)
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
