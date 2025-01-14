/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
/* eslint no-console: "off" */

const fs = require('fs');
const { rollup } = require('rollup');
const { default: babel } = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');
const { default: resolve } = require('@rollup/plugin-node-resolve');
const Terser = require('terser');
const commonjs = require('@rollup/plugin-commonjs');

const config = require('./build-config');
const banner = require('./banner')();

async function buildBundle(components, format, browser, cb) {
  const env = process.env.NODE_ENV || 'development';
  const external = format === 'umd' || browser ? [] : () => true;
  let filename = 'swiper-bundle';
  if (format !== 'umd') filename += `.${format}`;
  if (format === 'esm' && browser) filename += '.browser';
  const output = env === 'development' ? 'build' : 'package';
  const needSourceMap = env === 'production' && (format === 'umd' || (format === 'esm' && browser));

  return rollup({
    input: './src/swiper.js',
    external,
    plugins: [
      replace({
        delimiters: ['', ''],
        'process.env.NODE_ENV': JSON.stringify(env),
        '//IMPORT_COMPONENTS': components
          .map(
            (component) =>
              `import ${component.capitalized} from './components/${component.name}/${component.name}';`,
          )
          .join('\n'),
        '//INSTALL_COMPONENTS': components
          .map((component) => `${component.capitalized}`)
          .join(',\n  '),
        '//EXPORT':
          format === 'umd' ? 'export default Swiper;' : 'export default Swiper; export { Swiper }',
      }),
      resolve({ mainFields: ['module', 'main', 'jsnext'] }),
      commonjs(),
      babel({ babelHelpers: 'bundled' }),
    ],
    onwarn() {},
  })
    .then((bundle) =>
      bundle.write({
        format,
        name: 'Swiper',
        strict: true,
        sourcemap: needSourceMap,
        sourcemapFile: `./${output}/${filename}.js.map`,
        banner,
        file: `./${output}/${filename}.js`,
      }),
    )
    .then(async (bundle) => {
      if (!browser && (format === 'cjs' || format === 'esm')) {
        // Fix imports
        const modularContent = fs
          .readFileSync(`./${output}/${filename}.js`, 'utf-8')
          .replace(/require\('\.\//g, `require('./${format}/`)
          .replace(/from '\.\//g, `from './${format}/`);
        fs.writeFileSync(`./${output}/${filename}.js`, modularContent);
      }
      if (env === 'development' || !browser) {
        if (cb) cb();
        return;
      }
      const result = bundle.output[0];
      const { code, map } = await Terser.minify(result.code, {
        sourceMap: {
          content: needSourceMap ? result.map : undefined,
          filename: needSourceMap ? `${filename}.min.js` : undefined,
          url: `${filename}.min.js.map`,
        },
        output: {
          preamble: banner,
        },
      }).catch((err) => {
        console.error(`Terser failed on file ${filename}: ${err.toString()}`);
      });

      fs.writeFileSync(`./${output}/${filename}.min.js`, code);
      fs.writeFileSync(`./${output}/${filename}.min.js.map`, map);
      if (cb) cb();
    })
    .catch((err) => {
      if (cb) cb();
      console.error(err.toString());
    });
}

async function build() {
  const env = process.env.NODE_ENV || 'development';
  const components = [];
  config.components.forEach((name) => {
    // eslint-disable-next-line
    const capitalized = name
      .split('-')
      .map((word) => {
        return word
          .split('')
          .map((char, index) => {
            if (index === 0) return char.toUpperCase();
            return char;
          })
          .join('');
      })
      .join('');
    const jsFilePath = `./src/components/${name}/${name}.js`;
    if (fs.existsSync(jsFilePath)) {
      components.push({ name, capitalized });
    }
  });
  if (env === 'development') {
    return Promise.all([
      buildBundle(components, 'umd', true, () => {}),
      buildBundle(components, 'esm', false, () => {}),
    ]);
  }
  return Promise.all([
    buildBundle(components, 'esm', false, () => {}),
    buildBundle(components, 'esm', true, () => {}),
    buildBundle(components, 'umd', true, () => {}),
    buildBundle(components, 'cjs', false, () => {}),
  ]);
}

module.exports = build;
