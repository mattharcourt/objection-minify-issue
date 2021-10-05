import { build } from 'esbuild'

let minify = process.argv.includes('--minify')
let minifyIdentifiers = !minify && process.argv.includes('--minify-identifiers')
let minifySyntax = !minify && process.argv.includes('--minify-syntax')
let minifyWhitespace = !minify && process.argv.includes('--minify-whitespace')

let outfile = minify
  ? 'out.minify.js'
  : minifyWhitespace || minifyWhitespace || minifyIdentifiers
  ? 'out.partial-minify.js'
  : 'out.js'

build({
  bundle: true,
  entryPoints: ['example.js'],
  external: ['sqlite3'],
  target: ['node14'],
  platform: 'node',
  format: 'esm',
  minify,
  minifySyntax,
  minifyWhitespace,
  minifyIdentifiers,
  outfile,
  banner: {
    js: `
      import { createRequire as creq } from 'module'
      const require = creq(import.meta.url)
    `,
  },
}).catch(() => process.exit(1))
