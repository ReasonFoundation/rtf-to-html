"use strict";
const parse = require("@reason-dev/rtf-parser");
const rtfToHTML = require("./rtf-to-html.js");

module.exports = asStream;
module.exports.fromStream = fromStream;
module.exports.fromString = fromString;

function asStream(opts, cb) {
  if (arguments.length === 1) {
    cb = opts;
    opts = null;
  }
  return parse(htmlifyresult(opts, cb));
}

function fromStream(stream, opts, cb) {
  if (arguments.length === 2) {
    cb = opts;
    opts = null;
  }
  const output = parse.stream(stream, htmlifyresult(opts, cb));
  return output;
}

function fromString(string, opts, cb) {
  if (arguments.length === 2) {
    cb = opts;
    opts = null;
  }
  return parse.string(string, htmlifyresult(opts, cb));
}

function htmlifyresult(opts, cb) {
  return (err, doc) => {
    if (err) return cb(err);
    try {
      return cb(null, rtfToHTML(doc, opts));
    } catch (ex) {
      return cb(ex);
    }
  };
}
