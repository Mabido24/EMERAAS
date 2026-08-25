import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const templatesDir = path.join(rootDir, 'templates')
const localesDir = path.join(rootDir, 'locales')

const languages = [
  { code: 'en', label: '🇬🇧 EN' },
  { code: 'fr', label: '🇫🇷 FR' },
  { code: 'de', label: '🇩🇪 DE' },
  { code: 'it', label: '🇮🇹 IT' },
  { code: 'es', label: '🇪🇸 ES' },
  { code: 'pt', label: '🇵🇹 PT' },
  { code: 'th', label: '🇹🇭 TH' },
  { code: 'ru', label: '🇷🇺 RU' },
  { code: 'zh', label: '🇨🇳 ZH' },
  { code: 'ar', label: '🇦🇪 AR' }
]

function pageUrl(langCode, pageName) {
  const base = pageName.replace(/\.html$/, '')
  const isIndex = base === 'index'
  if (langCode === 'en') {
    return isIndex ? '/' : `/${base}`
  }
  return isIndex ? `/${langCode}/` : `/${langCode}/${base}`
}

function generateLanguageSwitcher(currentLang, pageName) {
  const options = languages.map(lang => {
    const value = pageUrl(lang.code, pageName)
    const selected = lang.code === currentLang ? 'selected' : ''
    return `<option value="${value}" ${selected}>${lang.label}</option>`
  }).join('\n      ')
  
  return `
    <select onchange="window.location.href = this.value" class="bg-white border-2 border-red-200 text-slate-800 text-xs font-bold py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-red-600 cursor-pointer">
      ${options}
    </select>
  `
}

function compilePage(templateContent, lang, pageName, locales) {
  let content = templateContent
  
  // Replace language switcher placeholder
  const switcherHtml = generateLanguageSwitcher(lang, pageName)
  content = content.replace('{{language_switcher}}', switcherHtml)
  
  // Replace HTML lang and dir attributes
  if (lang === 'ar') {
    content = content.replace('<html lang="en">', '<html lang="ar" dir="rtl">')
    content = content.replace('<html lang="fr">', '<html lang="ar" dir="rtl">')
  } else {
    content = content.replace('<html lang="en">', `<html lang="${lang}">`)
    content = content.replace('<html lang="fr">', `<html lang="${lang}">`)
  }

  // Replace translation keys: {{key}}
  const regex = /\{\{([a-zA-Z0-9_]+)\}\}/g
  content = content.replace(regex, (match, key) => {
    // If the key exists in locales, return it, otherwise fallback to English, else original match
    if (locales[lang] && locales[lang][key] !== undefined) {
      return locales[lang][key]
    }
    if (locales['en'] && locales['en'][key] !== undefined) {
      return locales['en'][key]
    }
    return match
  })

  // Rewrite internal links if we are inside a language subdirectory (non-English)
  // Extensionless paths match Cloudflare Pages pretty URLs.
  if (lang !== 'en') {
    // href="/about.html" -> href="/fr/about"
    // href="/about.html#x" -> href="/fr/about#x"
    // href="/" -> href="/fr/"
    // href="/#services" -> href="/fr/#services"
    content = content.replace(/href="\/([a-zA-Z0-9_-]+)\.html(#[a-zA-Z0-9_-]+)?"/g, (_, page, hash = '') => {
      return `href="/${lang}/${page}${hash}"`
    })
    content = content.replace(/href="\/(#[a-zA-Z0-9_-]+)?"/g, `href="/${lang}/$1"`)
  } else {
    // EN: strip .html for Cloudflare Pages pretty URLs
    content = content.replace(/href="\/([a-zA-Z0-9_-]+)\.html(#[a-zA-Z0-9_-]+)?"/g, 'href="/$1$2"')
  }
  
  return content
}

function main() {
  console.log('--- EMERAAS i18n Compiler ---')
  
  // Load all locales
  const locales = {}
  languages.forEach(lang => {
    const localePath = path.join(localesDir, `${lang.code}.json`)
    if (fs.existsSync(localePath)) {
      locales[lang.code] = JSON.parse(fs.readFileSync(localePath, 'utf8'))
    } else {
      console.warn(`Locale file not found: locales/${lang.code}.json`)
    }
  })
  
  // Get all template files
  const templates = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'))
  console.log(`Found ${templates.length} templates. compiling...`)
  
  languages.forEach(lang => {
    console.log(`Processing language: ${lang.code.toUpperCase()}`)
    
    // Create language subdirectory if it's not the default English
    const destDir = lang.code === 'en' ? rootDir : path.join(rootDir, lang.code)
    if (lang.code !== 'en' && !fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true })
    }
    
    templates.forEach(templateFile => {
      const templatePath = path.join(templatesDir, templateFile)
      const templateContent = fs.readFileSync(templatePath, 'utf8')
      
      const compiledContent = compilePage(templateContent, lang.code, templateFile, locales)
      
      const destPath = path.join(destDir, templateFile)
      fs.writeFileSync(destPath, compiledContent, 'utf8')
    })
  })
  
  console.log('🎉 EMERAAS i18n compilation finished successfully!')
}

main()
