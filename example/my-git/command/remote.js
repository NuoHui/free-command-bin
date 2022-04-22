'use strict';

const path = require('path');

const Command = require('../../../build/index');

class RemoteCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    console.log('do RemoteCommand')
    this.yargs.usage('Usage: my-git remote <add/remove>');
    this.load(path.join(__dirname, 'remote'));
    this.alias('rm', 'remote');
  }
};

module.exports = RemoteCommand;