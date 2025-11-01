const esbuild = require('esbuild');
const fs = require('fs');

(async () => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync('public')) fs.mkdirSync('public');

    await esbuild.build({
      entryPoints: ['src/index.js'],
      bundle: true,
      outfile: 'public/index.js',
      platform: 'browser',
      format: 'esm',
      target: ['es2017'],
      loader: { '.js': 'jsx', '.jsx': 'jsx' },
      sourcemap: false,
      minify: true,
    });

    console.log('Build finished: public/index.js');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
