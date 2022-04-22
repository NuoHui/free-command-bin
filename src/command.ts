const debug = require('debug')('free-command-bin');
const yargs = require('yargs');

const DISPATCH = Symbol('CommandBin#dispatch');
const PARSE = Symbol('CommandBin#parse');
const COMMANDS = Symbol('CommandBin#commands');
const VERSION = Symbol('CommandBin#version');

interface IParseOptions {
  execArgv: boolean;
  removeAlias: boolean;
  removeCamelCase: false;
}

class CommandBin {
  private rawArgs: string[];
  private yargs;
  private parseOptions: IParseOptions;
  private commands: any;
  constructor(rawArgs: string[]) {
    console.log(process.argv);
    this.rawArgs = rawArgs || process.argv.slice(2);
    debug('[%s] origin arguments', this.constructor.name, this.rawArgs.join(' '));

    this.yargs = yargs(this.rawArgs);
  
    this.parseOptions = {
      execArgv: false,
      removeAlias: false,
      removeCamelCase: false,
    };

    this.commands = new Map();
  }
}

module.exports = CommandBin;