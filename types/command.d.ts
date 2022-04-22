declare const debug: any;
declare const yargs: any;
declare const DISPATCH: unique symbol;
declare const PARSE: unique symbol;
declare const COMMANDS: unique symbol;
declare const VERSION: unique symbol;
interface IParseOptions {
    execArgv: boolean;
    removeAlias: boolean;
    removeCamelCase: false;
}
declare class CommandBin {
    private rawArgs;
    private yargs;
    private parseOptions;
    private commands;
    constructor(rawArgs: string[]);
}
