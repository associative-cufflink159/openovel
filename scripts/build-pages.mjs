import { build, stop } from "esbuild"
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "..")
const src = path.join(root, "src/electron/renderer")
const out = path.join(root, "dist-pages")
const appOut = path.join(out, "app")

await rm(out, { recursive: true, force: true })
await mkdir(appOut, { recursive: true })

const t0 = Date.now()

await cp(path.join(root, "site"), out, { recursive: true })
await cp(path.join(root, "assets"), path.join(out, "assets"), { recursive: true })
await writeFile(path.join(out, ".nojekyll"), "")

const toWebPath = (file) => `./${path.relative(appOut, file).split(path.sep).join("/")}`
const entryOutput = (metafile, entryPoint, extension) => {
  const wanted = path.resolve(entryPoint)
  const output = Object.entries(metafile.outputs).find(([, meta]) => (
    meta.entryPoint
    && path.resolve(root, meta.entryPoint) === wanted
    && meta.bytes > 0
  ))
  if (!output) throw new Error(`Could not find ${extension} output for ${entryPoint}`)
  return toWebPath(path.join(root, output[0]))
}

const jsBuild = await build({
  entryPoints: [path.join(src, "main.web.jsx")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome120",
  outdir: appOut,
  entryNames: "[name]-[hash]",
  chunkNames: "chunks/[name]-[hash]",
  splitting: true,
  jsx: "automatic",
  loader: { ".js": "jsx", ".jsx": "jsx", ".png": "dataurl", ".txt": "text" },
  define: { "process.env.NODE_ENV": '"production"' },
  metafile: true,
  sourcemap: false,
  logLevel: "warning",
})

const cssBuild = await build({
  entryPoints: [path.join(src, "styles/theme.css")],
  bundle: true,
  outdir: appOut,
  entryNames: "[name]-[hash]",
  loader: { ".css": "css" },
  metafile: true,
  logLevel: "warning",
})

const jsAsset = entryOutput(jsBuild.metafile, path.join(src, "main.web.jsx"), ".js")
const cssAsset = entryOutput(cssBuild.metafile, path.join(src, "styles/theme.css"), ".css")
const appHtml = (await readFile(path.join(src, "index.web.html"), "utf8"))
  .replace("./bundle.css", cssAsset)
  .replace("./bundle.js", jsAsset)

await writeFile(path.join(appOut, "index.html"), appHtml)

console.log(`pages site built in ${Date.now() - t0}ms -> ${path.relative(root, out)}`)

await stop()
process.exit(0)
