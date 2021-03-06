#!/usr/bin/env node

'use strict';

var fs = require('fs');
var typeOf = require('kind-of');
var filter = require('filter-object');
var omitEmpty = require('omit-empty');
var writeJson = require('write-json');
var extend = require('extend-shallow');

/**
 * Package files
 */

var pkg = require('load-pkg');

/**
 * Sync properties from package.json to bower.json.
 *
 * @param  {String} `patterns` Glob patterns for matching keys.
 * @param  {Object} `options`
 * @return {Object}
 */

function sync(config, patterns, options) {
  if (typeOf(config) !== 'object' || ! config) {
    options = patterns;
    patterns = config;
    config = pkg;
  }

  if (typeOf(patterns) === 'object') {
    options = patterns;
    patterns = null;
  }

  var opts = options || {};
  patterns = patterns || ['*'];

  opts.bowerFile = 'bower.json';
  opts.bowerFileExists = fs.existsSync(opts.bowerFile);

  // If bower.json doesn't exist yet, add one.
  if (!opts.bowerFileExists && opts.nobower !== true) {
    writeJson('bower.json', {});
  }

  // normalize `main` to an array
  config.main = arrayify(config.main);

  // normalize `authors` to bower.json format
  var authors = toAuthors(config);
  if (authors) {
    config.authors = authors;
  }

  return keys(config, patterns, opts);
}

function keys(o, patterns, options) {
  var res = filter(o, [
    'name', // required
    'description', // recommended
    'repository',
    'license', // recommended
    'homepage',
    'authors',
    'main', // recommended
    'ignore', // recommended
    'dependencies',
    'devDependencies',
    'keywords' // recommended
  ].concat(patterns), options);
  res = options.empty ? res : omitEmpty(res);

  if (options.bowerFileExists && options.extend) {
    var existing = JSON.parse(fs.readFileSync(options.bowerFile));
    res = extend(existing, res);
  }

  return res;
}

/**
 * Coerce `val` to an array
 *
 * @param  {*} val
 * @return {Array}
 */

function arrayify(val) {
  val = !Array.isArray(val) ? [val] : val;
  return val.filter(Boolean);
}

/**
 * Convert a Bower author to an npm person.
 *
 * See: <https://github.com/bower/bower.json-spec#authors>
 * See: <https://www.npmjs.org/doc/json.html#people-fields-author-contributors>
 *
 * @param  {String|Array} `author` A Bower author.
 * @return {String|Array}          An npm person.
 */

function toAuthor(author) {
  if (typeof author === 'object') {
    var res = author;
    if (author.url) {
      res.homepage = author.url;
      delete res.url;
    }
    return res;
  }

  if (typeof author === 'string') {
    return author;
  }
}

/**
 * Convert a npm `author` field or and/and `contributors`
 * field to a Bower `authors` field
 *
 * @param {Object} `pkg` package.json object
 * @return {Array}  An array of authors or null.
 */

function toAuthors(pkg, options) {
  var opts = options || {contributors: true};
  var authors = [];

  if (pkg.author) {
    authors.push(toAuthor(pkg.author));
  }

  if (opts.contributors && pkg.contributors && Array.isArray(pkg.contributors)) {
    pkg.contributors.forEach(function (contributor) {
      authors.push(toAuthor(contributor));
    });
  }
  return authors;
}

/**
 * Expose `sync`
 */

module.exports = sync;

/**
 * Expose author methods
 */

module.exports.toAuthor = toAuthor;
module.exports.toAuthors = toAuthors;
