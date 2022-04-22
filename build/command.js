"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const debug = require('debug')('free-command-bin');
const yargs = require('yargs');
const assert = require('assert');
const chalk = require('chalk');
const fs = require('fs');
class CommandBin {
    constructor(rawArgv) {
        this.commandVersion = '';
        this.rawArgv = rawArgv || process.argv.slice(2);
        debug('[%s] origin argument `%s`', this.constructor.name, this.rawArgv.join(' '));
        this.yargs = yargs(this.rawArgv);
        this.parseOptions = {
            execArgv: false,
            removeAlias: false,
            removeCamelCase: false,
        };
        this.commands = new Map();
    }
    showHelp(level = 'log') {
        this.yargs.showHelp(level);
    }
    set options(opt) {
        this.yargs.options(opt);
    }
    set usage(usage) {
        this.yargs.usage(usage);
    }
    set version(version) {
        this.commandVersion = version;
    }
    get version() {
        return this.commandVersion;
    }
    load(fullPath) {
        assert(fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(), `${fullPath} should exist and be a directory`);
        const files = fs.readdirSync(fullPath);
        const names = [];
        for (const file of files) {
            if (path_1.default.extname(file) !== '.js') {
                continue;
            }
            ;
            const name = path_1.default.basename(file).replace(/\.js$/, '');
            names.push(name);
            this.add(name, path_1.default.join(fullPath, file));
        }
        ;
        debug('[%s] loaded command `%s` from directory `%s`', this.constructor.name, names, fullPath);
    }
    async start() {
        try {
            const index = this.rawArgv.indexOf('--get-yargs-completions');
            if (index !== -1) {
                this.rawArgv.splice(index, 2, `--AUTO_COMPLETIONS=${this.rawArgv.join(',')}`);
            }
            await this.dispatch();
        }
        catch (error) {
            this.errorHandler(error);
        }
    }
    run() {
        this.showHelp();
    }
    alias(alias, name) {
        assert(alias, 'alias command name is required');
        assert(this.commands.has(name), `${name} should be added first`);
        debug('[%s] set `%s` as alias of `%s`', this.constructor.name, alias, name);
        this.commands.set(alias, this.commands.get(name));
        console.log('alias', this.commands);
    }
    add(commandName, target) {
        assert(commandName, `${commandName} is required`);
        if (typeof CommandBin === 'string') {
            assert(fs.existsSync(target) && fs.statSync(target).isFile(), `${target} is not a file`);
            debug('[%s] add command `%s` from `%s`', this.constructor.name, commandName, target);
            target = require(target);
            if (target && target.__esModule && target.default) {
                target = target.default;
            }
            ;
        }
        ;
        this.commands.set(commandName, target);
        console.log(this.commands);
    }
    errorHandler(err) {
        console.error(chalk.red(`⚠️  ${err.name}: ${err.message}`));
        console.error(chalk.red('⚠️  Command Error, enable `DEBUG=common-bin` for detail'));
        debug('args %s', process.argv.slice(3));
        debug(err.stack);
        process.exit(1);
    }
    async dispatch() {
        this.yargs
            .completion()
            .help()
            .version()
            .wrap(20)
            .alias('h', 'help')
            .alias('v', 'version')
            .group(['help', 'version'], 'Global Options:');
        const parsed = await this.parse(this.rawArgv);
        console.log('parsed', parsed);
    }
    parse(rawArgv) {
        return new Promise((resolve, reject) => {
            this.yargs.parse(rawArgv, (err, argv) => {
                if (err)
                    return reject(err);
                resolve(argv);
            });
        });
    }
}
module.exports = CommandBin;
