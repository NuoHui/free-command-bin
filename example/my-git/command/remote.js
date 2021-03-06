'use strict';

const path = require('path');

const Command = require('../../../build/index');

class RemoteCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.yargs.usage('Usage: my-git remote <add/remove>');
    this.load(path.join(__dirname, 'remote'));
    this.alias('rm', 'remove');
  }
};

module.exports = RemoteCommand;