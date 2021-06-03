#!/usr/bin/env node
import { sync } from 'fast-glob'
import { build } from 'esbuild'

const main = async () => {
  const files = sync(['*.ts', 'app/**/*.ts', 'config/**/*.ts'])
  console.log(`build files: \n`, files)

  const entryPoints: Record<string, string> = {}
  files.forEach((f) => {
    entryPoints[f.replace(/\.ts$/, '')] = f
  })

  const res = await build({
    outdir: '.',
    entryPoints,
    sourcemap: 'inline',
    target: 'es2017',
    minify: false,
    tsconfig: './tsconfig.json',
    platform: 'node',
    format: 'cjs',
  })

  console.log('success: ', res)
}

main()
