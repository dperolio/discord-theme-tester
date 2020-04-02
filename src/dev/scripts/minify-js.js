const minify = require('@node-minify/core');
const babelMinify = require('@node-minify/babel-minify');

// Using babelMinify with wildcards
minify({
  compressor: babelMinify,
  input: 'src/core/*.js',
  output: 'assets/js/main.min.js',
  callback: function(err, min) {}
});