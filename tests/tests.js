const rimraf = require("rimraf");
const fs = require("fs");
const path = require("path");
const os = require("os");
const ChmodWebpackPlugin = require("./../chmod-webpack-plugin");

const getChmod = (path) => parseInt(fs.statSync(path).mode.toString(8), 10).toString().slice(-3) * 1;

module.exports = function () {
    describe(".fixWindowsPath()", () => {
        it("should transform the windows-stype path to unix-style", () => {
            const transformSource = "C:\\some\\path";

            expect(ChmodWebpackPlugin.fixWindowsPath(transformSource, true)).toEqual("C:/some/path");
        });

        it("should uppercase first symbol (it is drive letter)", () => {
            const transformSource = "c:\\some\\path";

            expect(ChmodWebpackPlugin.fixWindowsPath(transformSource)[0]).toEqual("C");
        });
    });

    describe(".constructor()", () => {
        it("should throw on bad 1st parameter", () => {
            try {
                new ChmodWebpackPlugin();
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            try {
                new ChmodWebpackPlugin(123);
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            try {
                new ChmodWebpackPlugin([123, 123]);
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            let errorsEmitted = false;

            try {
                new ChmodWebpackPlugin({path: "somePath1"});
            }
            catch (e) {
                errorsEmitted = true;
            }

            expect(errorsEmitted).toBeFalsy();
        });

        it("should throw on bad path parameter", () => {
            try {
                new ChmodWebpackPlugin({path: 123123});
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            try {
                new ChmodWebpackPlugin({path: [null, 123]});
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            try {
                new ChmodWebpackPlugin({path: []});
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            let errorsEmitted = false;

            try {
                new ChmodWebpackPlugin({path: "somePath1"});
                new ChmodWebpackPlugin([{path: "somePath2"}]);
                new ChmodWebpackPlugin([{path: ["somePath3", "somePath4"]}]);
            }
            catch (e) {
                errorsEmitted = true;
            }

            expect(errorsEmitted).toBeFalsy();
        });

        it("should throw if root is not a string", () => {
            try {
                new ChmodWebpackPlugin({path: "somePath1", root: 123123});
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }

            let errorsEmitted = false;

            try {
                new ChmodWebpackPlugin({path: "somePath1", root: "somePath2"});
            }
            catch (e) {
                errorsEmitted = true;
            }

            expect(errorsEmitted).toBeFalsy();
        });
    });

    describe(".hookCallback()", () => {
        it("should call the callback", () => {
            const spy = jest.fn(() => {});
            const plugin = new ChmodWebpackPlugin({path: "somePath1", silent: true});

            plugin.hookCallback(undefined, spy);

            expect(spy).toHaveBeenCalled();
        });

        it("should call the .clean() method", () => {
            const plugin = new ChmodWebpackPlugin({path: "somePath1", silent: true});

            const spy = jest.spyOn(plugin, "setPermissions");
            plugin.hookCallback(undefined, () => {});

            expect(spy).toHaveBeenCalled();
        });
    });

    describe(".apply()", () => {
        const compiler = {
            hooks: {
                afterEmit: {
                    tapAsync: jest.fn(() => {}),
                },
            },
        };

        it("should instantly perform ther setPermissions if first parameter not passed", () => {
            const plugin = new ChmodWebpackPlugin({path: "somePath1", silent: true});

            const spy = jest.spyOn(plugin, "setPermissions");

            plugin.apply();
            expect(spy).toHaveBeenCalled();
        });

        it("should tap the afterEmit hook ", () => {
            const plugin = new ChmodWebpackPlugin({path: "somePath1", silent: true});

            plugin.apply(compiler);

            expect(compiler.hooks.afterEmit.tapAsync).toHaveBeenCalled();
            compiler.hooks.afterEmit.tapAsync.mockReset();
        });
    });

    describe(".setPermissions()", () => {
        let testDir1 = path.join(__dirname, "test_dir1");
        let testDir2 = path.join(testDir1, "test_dir2");
        let testFile1 = path.join(testDir1, "test_file1");
        let testFile2 = path.join(testDir2, "test_file2");

        if (os.platform() === "win32") {
            testDir1 = ChmodWebpackPlugin.fixWindowsPath(testDir1);
            testDir2 = ChmodWebpackPlugin.fixWindowsPath(testDir2);
            testFile1 = ChmodWebpackPlugin.fixWindowsPath(testFile1);
            testFile2 = ChmodWebpackPlugin.fixWindowsPath(testFile2);
        }

        beforeEach(() => {
            rimraf.sync(testDir1);

            fs.mkdirSync(testDir1);
            fs.mkdirSync(testDir2);
            fs.writeFileSync(testFile1, "");
            fs.writeFileSync(testFile2, "");

            fs.chmodSync(testDir1, "770");
            fs.chmodSync(testDir2, "770");
            fs.chmodSync(testFile1, "645");
            fs.chmodSync(testFile2, "645");
        });
        afterEach(() => {
            rimraf.sync(testDir1);
        });

        it("should throw if configs are empty", () => {
            const plugin = new ChmodWebpackPlugin({path: "somePath1", silent: true});

            try {
                plugin.setPermissions();
            }
            catch (e) {
                expect(e).toBeInstanceOf(Error);
            }
        });

        if (os.platform() !== "win32") {
            it("should set permissions for files", () => {
                const plugin = new ChmodWebpackPlugin({path: testFile1, silent: true, mode: 755});

                plugin.setPermissions();

                expect(getChmod(testFile1)).toEqual(755);
            });

            it("should set permissions for directories", () => {
                const plugin = new ChmodWebpackPlugin({path: testDir1, silent: true, mode: 755});

                plugin.setPermissions();

                expect(getChmod(testDir1)).toEqual(755);
            });

            it("should set permissions only for directories if directoriesOnly is set", () => {
                const plugin = new ChmodWebpackPlugin({path: testDir1 + '/**', silent: true, mode: 755, directoriesOnly: true});

                plugin.setPermissions();

                expect(getChmod(testDir1)).toEqual(755);
                expect(getChmod(testDir2)).toEqual(755);
                expect(getChmod(testFile1)).toEqual(645);
                expect(getChmod(testFile2)).toEqual(645);
            });

            it("should set permissions only for files if filesOnly is set", () => {
                const plugin = new ChmodWebpackPlugin({path: testDir1 + '/**', silent: true, mode: 755, filesOnly: true});

                plugin.setPermissions();

                expect(getChmod(testDir1)).toEqual(770);
                expect(getChmod(testDir2)).toEqual(770);
                expect(getChmod(testFile1)).toEqual(755);
                expect(getChmod(testFile2)).toEqual(755);
            });

            it("should set permissions set permissions both for files and directories if both directoriesOnly and filesOnlyare set", () => {
                const plugin = new ChmodWebpackPlugin({path: testDir1 + '/**', silent: true, mode: 755, filesOnly: true, directoriesOnly: true});

                plugin.setPermissions();

                expect(getChmod(testDir1)).toEqual(755);
                expect(getChmod(testDir2)).toEqual(755);
                expect(getChmod(testFile1)).toEqual(755);
                expect(getChmod(testFile2)).toEqual(755);
            });
        }
    });
};
