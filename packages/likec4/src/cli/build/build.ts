import { rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { viteBuild } from '../../vite/vite-build'
import { ensureReact } from '../ensure-react'
import { pngHandler } from '../export/png/handler'

const { cyan, dim } = k

type HandlerParams = {
  /**
   * The directory where c4 files are located.
   */
  path: string
  /**
   * output directory
   */
  output?: string | undefined
  /**
   * base url the app is being served from
   * @default '/'
   */
  base?: string | undefined

  /**
   * overview all diagrams as graph
   */
  useOverview?: boolean | undefined

  useDotBin: boolean

  useHashHistory: boolean | undefined

  webcomponentPrefix: string

  /**
   * base title of the app pages
   * @default 'LikeC4'
   */
  title: string | undefined

  outputSingleFile: boolean | undefined
}

export async function buildHandler({
  path,
  useDotBin,
  useHashHistory,
  webcomponentPrefix,
  title,
  useOverview = false,
  output: outputDir,
  outputSingleFile,
  base,
}: HandlerParams) {
  await ensureReact()

  const logger = createLikeC4Logger('c4:build')

  const languageServices = await LikeC4.fromWorkspace(path, {
    graphviz: useDotBin ? 'binary' : 'wasm',
    logger: 'vite',
  })

  const outDir = outputDir ?? resolve(languageServices.workspace, 'dist')
  let likec4AssetsDir = resolve(outDir, 'assets')

  if (useOverview) {
    try {
      likec4AssetsDir = resolve(outDir, 'assets', 'previews')
      await mkdir(likec4AssetsDir, { recursive: true })
      logger.info(`${cyan('Generate previews')} ${dim(likec4AssetsDir)}\n`)

      await pngHandler({
        path,
        useDotBin,
        output: likec4AssetsDir,
        outputType: 'flat',
        ignore: true,
      })
    } catch (error) {
      logger.error(k.red('Failed to generate previews'))
      logger.error(error)
      logger.warn(k.yellow('Ignore previews and continue build'))
      rmSync(likec4AssetsDir, { recursive: true, force: true })
      useOverview = false
    }
  }
  await viteBuild({
    base,
    useHashHistory: outputSingleFile || useHashHistory,
    customLogger: logger,
    useOverviewGraph: useOverview,
    webcomponentPrefix,
    title,
    languageServices,
    likec4AssetsDir,
    outputDir,
    outputSingleFile,
  })

  if (useOverview) {
    logger.info(`${cyan('clean previews')} ${dim(likec4AssetsDir)}`)
    rmSync(likec4AssetsDir, { recursive: true, force: true })
  }
}
