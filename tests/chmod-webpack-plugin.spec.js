const os = require("os");
const tests = require("./tests");
const windowsEmulation = require("./windowsEmulation");

describe("chmod-webpack-plugin",
         () => {
             describe("os-native run", tests);

             if (os.platform() !== "win32") {
                 describe("windows emulation", windowsEmulation);
             }
         });
