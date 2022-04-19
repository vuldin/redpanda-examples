const esbuild = require('esbuild')
const registryPlugin = require('./lib/registryPlugin')

esbuild
  .build({
    entryPoints: ['src/main.mjs'],
    loader: {
      '.avsc': 'text',
      '.proto': 'text',
    },
    bundle: true,
    platform: 'node',
    outfile: 'dist/main.js',
    plugins: [
      registryPlugin,
    ]
  })
  .catch(() => process.exit(1))
