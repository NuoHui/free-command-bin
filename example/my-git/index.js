const path = require('path');
const Command = require('../../build/index');

class MyGitCommand extends Command {
  constructor(rowArgv) {
    super(rowArgv);
    this.usage = 'Usage: my-git <command> [options]';
    // 加载子命令
    this.load(path.join(__dirname, 'command'));
    this.yargs.alias('V', 'version');
  }
}

module.exports = MyGitCommand;