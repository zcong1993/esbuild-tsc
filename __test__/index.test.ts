import { main } from '../src'

it('should work well', async () => {
  const res = await main()
  expect(res).toStrictEqual({
    errors: [],
    mangleCache: undefined,
    metafile: undefined,
    outputFiles: undefined,
    warnings: [],
  })
})
