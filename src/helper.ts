const debug = require('debug')('common-bin');
const cp = require('child_process');
const is = require('is-type-of');

exports.callFn = async function(fn: any, args = [], thisArg: any) {
  if (!is.function(fn)) return;
  const r = fn.apply(thisArg, args);
  return r;
}