#!/usr/bin/env node

'use strict';

var fs = require('fs');
var cwd = require('cwd');
var typeOf = require('kind-of');
var extend = require('extend-shallow');
var filter = require('filter-object');
var omitEmpty = require('omit-empty');
var writeJson = require('write-json');

// If bower.json doesn't exist yet, add one.
if (!fs.existsSync('bower.json')) {
  writeJson('bower.json', {});
}

/**
 * Package files
 */

var bower = require(cwd('bower.json'));
var pkg = require('load-pkg');

/**
 * Expose `config`
 */

module.exports = sync;

/**
 * Sync properties from package.json to bower.json.
 *
 * @param  {Object} options
 * @return {Object}
 */

function sync(patterns, options) {
  if (typeOf(patterns) === 'object') {
    options = patterns;
    patterns = null;
  }

  var opts = extend({}, options);
  patterns = patterns || ['*'];

  // normalize `main` to an array
  pkg.main = arrayify(pkg.main);

  // normalize `authors` to bower.json format
  var authors = toAuthors(pkg);
  if (authors) {
    pkg.authors = authors;
  }

  delete pkg.version;
  return keys(pkg, patterns, opts);
}

function keys(o, patterns, options) {
  var res = filter(o, [
    'name',        // (required)
    'description', // (recommended)
    'repository',
    'license',     // (recommended)
    'homepage',
    'authors',
    'main',        // (recommended)
    'ignore',      // (recommended)
    'dependencies',
    'devDependencies',
    'keywords'    // (recommended)
  ].concat(patterns), options);
  return omitEmpty(res);
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


module.exports.toAuthor = toAuthor;
module.exports.toAuthors = toAuthors;