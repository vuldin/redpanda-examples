module.exports = {
  name: 'registry',
  setup(build) {
    const https = require('https')
    const http = require('http')
    let cache = new Map()

    build.onResolve({ filter: /^https?:\/\// }, (args) => ({
      path: args.path,
      namespace: 'registry-url',
    }))

    build.onLoad({ filter: /.*/, namespace: 'registry-url' }, async (args) => {
      const contents = await new Promise((resolve, reject) => {
        function fetch(url) {
          const lib = url.startsWith('https') ? https : http
          const req = lib
            .get(url, (res) => {
              if ([301, 302, 307].includes(res.statusCode)) {
                fetch(new URL(res.headers.location, url).toString())
                req.destroy()
              } else if (res.statusCode === 200) {
                let chunks = []
                res.on('data', (chunk) => chunks.push(chunk))
                res.on('end', () => {
                  const buffer = Buffer.concat(chunks)
                  const text = buffer.toString()
                  const json = JSON.parse(text)
                  const escapedText = json.schema
                  resolve(escapedText)
                })
              } else {
                reject(new Error(`GET ${url} failed: status ${res.statusCode}`))
              }
            })
            .on('error', reject)
        }
        fetch(args.path)
      })
      return { contents, loader: 'text' }
    })
  },
}
