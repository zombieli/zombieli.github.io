// Static production preview, including a real 404 response rather than SPA fallback.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
const root = resolve('dist')
const port = Number(process.env.PORT || 4173)
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.md':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.webmanifest':'application/manifest+json','.css':'text/css','.svg':'image/svg+xml','.json':'application/json','.csv':'text/csv','.pdf':'application/pdf','.webm':'video/webm','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.avif':'image/avif','.vtt':'text/vtt; charset=utf-8' }
createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    let target = resolve(root, '.' + pathname)
    if (target !== root && !target.startsWith(root + sep)) throw new Error('Outside root')
    if ((await stat(target)).isDirectory()) target = resolve(target,'index.html')
    const body = await readFile(target)
    res.writeHead(200,{'Content-Type':types[extname(target)] || 'application/octet-stream'})
    res.end(body)
  } catch {
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'})
    res.end(await readFile(resolve(root,'404.html')))
  }
}).listen(port,'127.0.0.1',()=>console.log(`Portfolio preview: http://127.0.0.1:${port}`))
