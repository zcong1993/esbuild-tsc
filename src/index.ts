import fs from 'fs'
import debug from 'debug'
import { sync } from 'fast-glob'
import { parse } from 'jsonc-parser'
import { build, BuildOptions } from 'esbuild'

const d = debug('etsc')

interface PartialTsConfig {
  files?: string[]
  include?: string[]
  exclude?: string[]
}

const esbuildConfigFile = '.esbuildrc.json'

const loadJSONConfig = (file: string, required?: boolean) => {
  if (!required && !fs.existsSync(file)) {
    return {}
  }
  const content = fs.readFileSync(file, 'utf8')
  return parse(content)
}

// some configurations are converted by esbuild itself from tsconfig.json
// https://github.com/evanw/esbuild/blob/0954cc60c6280a8b8d0fe5ef30499990a83d0cfb/internal/resolver/tsconfig_json.go#L44
const defaultBuildOptions: BuildOptions = {
  outdir: '.',
  minify: false,
  tsconfig: 'tsconfig.json',
  platform: 'node',
  format: 'cjs',
}

const scanSourceFiles = (tsconfig: PartialTsConfig): Record<string, string> => {
  const entryPoints: Record<string, string> = {}
  let matchers = ['**/*.ts']
  const ignores = ['**/*.d.ts', '**/node_modules/**']

  if (tsconfig.include?.length) {
    matchers = tsconfig.include
  } else if (tsconfig.exclude?.length) {
    // exclude only works when include not set
    ignores.push(...tsconfig.exclude)
  }

  const files = sync(matchers, { ignore: ignores })

  // always append tsconfig.files if set
  if (tsconfig.files?.length) {
    files.push(...tsconfig.files)
  }

  files.forEach((f) => {
    entryPoints[f.replace(/\.ts$/, '')] = f
  })

  return entryPoints
}

export const main = async () => {
  const userEsbuildConfig = loadJSONConfig(esbuildConfigFile)
  d(`try load userEsbuildConfig: ${esbuildConfigFile}`, userEsbuildConfig)

  const buildOptions: BuildOptions = {
    ...defaultBuildOptions,
    ...userEsbuildConfig,
  }

  d('merged buildOptions: ', buildOptions)

  const tsconfig: PartialTsConfig = loadJSONConfig(buildOptions.tsconfig!, true)

  d(`try load tsconfig: ${buildOptions.tsconfig}`, tsconfig)

  const entryPoints = scanSourceFiles(tsconfig)

  d('entryPoints: ', entryPoints)

  buildOptions.entryPoints = entryPoints

  const res = await build(buildOptions)

  return res
}
