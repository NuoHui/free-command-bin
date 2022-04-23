import path from "path";

const debug = require('debug')('free-command-bin');
const yargs = require('yargs');
const assert = require('assert');
const chalk = require('chalk');
const changeCase = require('change-case');
const fs = require('fs');
const helper = require('./helper');

interface IParserOptions {
  removeAlias: boolean;
  removeCamelCase: false;
};

class CommandBin {
  private rawArgv: string[];
  private yargs;
  private parserOptions: IParserOptions;
  private commands: Map<string, CommandBin | undefined>;
  private helper: any;
  private commandVersion: string = '';
  constructor(rawArgv: string[]) {
    // 保存原始的命名行参数
    this.rawArgv = rawArgv || process.argv.slice(2);
    debug('[%s] origin argument `%s`', this.constructor.name, this.rawArgv.join(' '));
    
    // 创建yargs
    this.yargs = yargs(this.rawArgv);
  
    this.parserOptions = {
      // 从yargs argv 移除alias
      removeAlias: false,
      // 从yargs argv 移除 camel case
      removeCamelCase: false,
    };

    this.helper = helper;
    
    this.commands = new Map();
  }

  /**
   * 使用标准输出打印the usage data.
   * @param level consoleLevel
   */
  private showHelp(level = 'log') {
    this.yargs.showHelp(level);
  }
  
  // 都是一些透传设置方法

  set options(opt: any) {
    this.yargs.options(opt);
  }

  set usage(usage: string) {
    this.yargs.usage(usage);
  }

  set version(version: string) {
    this.commandVersion = version;
  }

  get version() {
    return this.commandVersion;
  }

  get context() {
    // { _: [ 'test' ], '$0': 'bin/my-git.js' }
    const argv = this.yargs.argv;

    const context = {
      argv,
      cwd: process.cwd(),
      env: Object.assign({}, process.env),
      rawArgv: this.rawArgv
    };

    argv.help = undefined;
    argv.h = undefined;
    argv.version = undefined;
    argv.v = undefined;

    if (this.parserOptions.removeAlias) {
      const alias = this.yargs.getOptions().alias;
      for (const key of Object.keys(alias)) {
        alias[key].forEach((item: any) => {
          argv[item] = undefined;
        })
      }
    };

    // remove camel case result
    if (this.parserOptions.removeCamelCase) {
      for (const key of Object.keys(argv)) {
        if (key.includes('-')) {
          argv[changeCase.camel(key)] = undefined;
        }
      }
    }

    return context;
  }

  /**
   * 加载子模块
   * @param fullPath 文件夹路径
   */
  public load (fullPath: string) {
    // 检查fullPath是否存在 && 是目录
    assert(fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory(), `${fullPath} should exist and be a directory`);

    // 文件夹下文件、空文件夹即为空数组
    const files = fs.readdirSync(fullPath);
    const names = [];
    for (const file of files) {
      // file为文件名
      if (path.extname(file) !== '.js') {
        continue;
      };
      // save command names
      const name = path.basename(file).replace(/\.js$/, '');
      names.push(name);
      this.add(name, path.join(fullPath, file))
    };
    debug('[%s] loaded command `%s` from directory `%s`', this.constructor.name, names, fullPath);
  }

  /**
   * bin process的入口
   */
  public async start() {
    try {
      const index = this.rawArgv.indexOf('--get-yargs-completions');
      if (index !== -1) {
        // bash will request as `--get-yargs-completions my-git remote add`, so need to remove 2
        this.rawArgv.splice(index, 2, `--AUTO_COMPLETIONS=${this.rawArgv.join(',')}`);
      }
      await this.dispatch();
    } catch (error: unknown) {
      this.errorHandler(error as Error);
    }
  }

  public run() {
    this.showHelp();
  }

  /**
   * 创建别名命令
   * @param alias alias command
   * @param name exist command
   */
  public alias(alias: string, name: string) {
    assert(alias, 'alias command name is required');
    assert(this.commands.has(name), `${name} should be added first`);
    debug('[%s] set `%s` as alias of `%s`', this.constructor.name, alias, name);
    this.commands.set(alias, this.commands.get(name));
  }

  /**
   * 
   * @param commandName a command name
   * @param target special file path (must contains ext) or CommandBin Class
   */
  private add(commandName: string, target: string | CommandBin) {
    assert(commandName, `${commandName} is required`);
    if (typeof target === 'string') {
      // target is file
      assert(fs.existsSync(target) && fs.statSync(target).isFile(), `${target} is not a file`);
      debug('[%s] add command `%s` from `%s`', this.constructor.name, commandName, target);
      target = require(target);
      // 支持ESM
      // @ts-ignore
      if (target && target.__esModule && target.default) {
        // @ts-ignore
        target = target.default;
      };
    };
    // 添加command的映射
    this.commands.set(commandName, target as CommandBin);
  }

  /**
   * 默认错误处理
   * @param err {Error} err - error object
   */
  private errorHandler(err: Error) {
    console.error(chalk.red(`⚠️  ${err.name}: ${err.message}`));
    console.error(chalk.red('⚠️  Command Error, enable `DEBUG=common-bin` for detail'));
    debug('args %s', process.argv.slice(3));
    debug(err.stack);
    process.exit(1);
  }

  private async dispatch() {
    // completion 命令行补全
    this.yargs
      .completion()
      .help()
      .version()
      .wrap(120)
      .alias('h', 'help')
      .alias('v', 'version')
      .group(['help', 'version'], 'Global Options:');
    
    const parsed = await this.parse(this.rawArgv);
    // example parsed { _: [ 'remote' ], '$0': 'bin/my-git.js' }
    const commandName = parsed._[0];
    if (parsed.version && this.version) {
      console.log(this.version);
      return;
    };

    // if sub command exist
    if (this.commands.has(commandName)) {
      // 匹配对应 sub Command Class
      const Command = this.commands.get(commandName);
      const rawArgv = this.rawArgv.slice();
      rawArgv.splice(rawArgv.indexOf(commandName), 1);

      // @ts-ignore
      debug('[%s] dispatch to subcommand `%s` -> `%s` with %j', this.constructor.name, commandName, Command.name, rawArgv);
      const command = this.getSubCommandInstance(Command, rawArgv);
      await command.dispatch();
      return;
    }

    // 注册command
    for (const [name, Command] of this.commands.entries()) {
      // 定义应用暴露出来的命令
      // 参数：cmd ，必须是一个字符串类型命令名称，或者是一个数组，数组的类型是字符串，代表是命令的名称或者命令的别名
      // 参数: desc，用来描述命令是作什么用的， 如果设置 desc 的值为 false，则会创建一个隐藏的指令
      // @ts-ignore
      this.yargs.command(name, Command.prototype?.description || '');
    }

    debug('[%s] exec run command', this.constructor.name);

    const context = this.context;
    // print completion for bash 用于支持命名行自动补全提示
    if (context.argv.AUTO_COMPLETIONS) {
      this.yargs.getCompletion(this.rawArgv.slice(1), (completions: any) => {
          console.log('%s', completions)
          completions.forEach((x: any) => console.log(x));
      })
    } else {
      // 执行run方法
      await this.helper.callFn(this.run, [ context ], this);
    }
  }

  /**
   * @param Command 
   * @param rawArgv 
   * @returns 初始化子command、返回实例
   */
  private getSubCommandInstance(Command: any, rawArgv: string[]) {
    return new Command(rawArgv)
  }

  private parse(rawArgv: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.yargs.parse(rawArgv, (err: Error, argv: string) => {
        if (err) return reject(err);
        // {
        //   _: [ 'remote', 'add', 'gh://node-modules/common-bin' ],
        //   '$0': 'my-git'
        // }
        resolve(argv);
      })
    })
  }
}

module.exports = CommandBin;