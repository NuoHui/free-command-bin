"use strict";
const debug = require('debug')('common-bin');
const cp = require('child_process');
const is = require('is-type-of');
exports.callFn = async function (fn, args = [], thisArg) {
    if (!is.function(fn))
        return;
    const r = fn.apply(thisArg, args);
    return r;
};
