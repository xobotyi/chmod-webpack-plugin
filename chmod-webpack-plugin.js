const fs = require("fs");
const path = require("path");
const glob = require("glob");
const os = require("os");
const chalk = require("chalk");

const PLUGIN_NAME = "chmod-webpack-plugin";

class ChmodWebpackPlugin
{
    constructor(options, commonOptions = {}) {
        this.configs = [];

        if (!Array.isArray(options)) {
            if (typeof options !== "object") {
                throw new Error("1st parameter expected to be an object or array of objects");
            }

            options = [options];
        }

        for (let config of options) {
            if (typeof config !== "object") {
                throw new Error("1st parameter elements expected to be an object, got " + typeof config);
            }

            const cfg = {
                path:            undefined,
                recursive:       true,
                mode:            644,
                root:            undefined,
                verbose:         false,
                silent:          false,
                dryDun:          false,
                filesOnly:       false,
                directoriesOnly: false,
                exclude:         [],
                ...commonOptions,
                ...config,
            };

            // path should be taken only from config
            cfg.path = config.path || undefined;
            cfg.mode = config.mode + "";

            if (typeof cfg.path === "string") {
                cfg.path = [cfg.path];
            }
            else if (!Array.isArray(cfg.path)) {
                throw new Error("path has to be a string or an array of strings, got " + typeof cfg.path);
            }
            else if (!cfg.path.length) {
                throw new Error("path has to contain at least one entity");
            }

            for (let path of cfg.path) {
                if (typeof path !== "string") {
                    throw new Error("path elements elements expected to be a string, got " + typeof path);
                }
            }

            if (typeof cfg.exclude === "string") {
                cfg.exclude = [cfg.exclude];
            }
            else if (!Array.isArray(cfg.exclude)) {
                throw new Error("exclude has to be a string or an array of strings, got " + typeof cfg.exclude);
            }

            for (let path of cfg.exclude) {
                if (typeof path !== "string") {
                    throw new Error("exclude elements elements expected to be a string, got " + typeof path);
                }
            }

            if (cfg.root && typeof cfg.root !== "string") {
                throw new Error("root has to be a string");
            }

            cfg.root = path.resolve(cfg.root || path.dirname(module.parent.filename));

            if (os.platform() === "win32") {
                cfg.root = ChmodWebpackPlugin.fixWindowsPath(cfg.root);
            }

            this.configs.push(cfg);
        }

        this.setPermissions = this.setPermissions.bind(this);
        this.hookCallback = this.hookCallback.bind(this);
    }

    static fixWindowsPath(pathToFix, forceWindowsSeparatorSplit = false) {
        const splittedPath = pathToFix.split(forceWindowsSeparatorSplit ? path.win32.sep : path.sep);
        splittedPath[0] = splittedPath[0].toUpperCase();

        return splittedPath.join("/");
    }

    setPermissions() {
        const result = [];

        for (let config of this.configs) {
            for (let pathToProcess of config.path) {
                pathToProcess = path.resolve(config.root, pathToProcess);

                if (os.platform() === "win32") {
                    pathToProcess = ChmodWebpackPlugin.fixWindowsPath(pathToProcess);
                }

                const excludedPaths = [];
                const ignored = [];
                const processed = [];

                const matchedDirectories = [];
                const matchedFiles = [];

                config.exclude.forEach((excludeGlob) => {
                    excludedPaths.push(...glob.sync(excludeGlob,
                                                    {
                                                        cwd:      config.root,
                                                        absolute: true,
                                                        mark:     true,
                                                    }));
                });

                glob.sync(pathToProcess,
                          {
                              cwd:      config.root,
                              absolute: true,
                              mark:     true,
                          })
                    .forEach((match) => {
                        if (excludedPaths.includes(match)) {
                            ignored.push(match);

                            !config.silent && config.verbose && console.log(`  ${match}\t${chalk.yellow("ignored")}`);
                            return;
                        }

                        if (match.slice(-1) === "/") {
                            if (config.directoriesOnly || (!config.directoriesOnly && !config.filesOnly)) {
                                if (!config.dryRun) {
                                    fs.chmodSync(match, config.mode);
                                }

                                processed.push(match);
                            }
                        }
                        else {
                            if (config.filesOnly || (!config.directoriesOnly && !config.filesOnly)) {
                                if (!config.dryRun) {
                                    fs.chmodSync(match, config.mode);
                                }

                                processed.push(match);
                            }
                        }

                        !config.silent && config.verbose && console.log(`  ${match}\t${chalk.green(config.mode)}`);
                    });

                if (!config.silent) {
                    console.log(`${PLUGIN_NAME}: ${pathToProcess}\t${chalk.green(config.mode)} (${processed.length} path(s), ${ignored.length} ignored)`);
                }

                result.push({
                                path:        pathToProcess,
                                result:      `processed [${processed.length} path(s), ${ignored.length} ignored]`,
                                directories: matchedDirectories,
                                files:       matchedFiles,
                            });
            }
        }

        return result;
    }

    /**
     * @param arg
     * @param callback {function}
     */
    hookCallback(arg, callback) {
        this.setPermissions();

        callback();
    }

    apply(compiler) {
        if (!compiler) {
            return this.setPermissions();
        }

        compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, this.hookCallback);
    }
}

module.exports = ChmodWebpackPlugin;
