import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import bundleSize from 'rollup-plugin-bundle-size'

const name = require('./package.json').main.replace(/\.js$/, '')

const ext = format =>
  format == 'dts' ? 'd.ts' : format == 'cjs' ? 'js' : 'mjs'

const bundle = format => ({
  input: 'src/index.ts',
  output: {
    file: `${name}.${ext(format)}`,
    format: format == 'cjs' ? 'cjs' : 'es',
    sourcemap: format != 'dts',
    sourcemapExcludeSources: true,
  },
  plugins:
    format == 'dts' ? [dts()] : [esbuild(), bundleSize()],
  external: id => !/^[./]/.test(id),
})

export default [
  bundle('es'), //
  bundle('cjs'),
  bundle('dts'),
]
