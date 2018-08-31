<h1 align="center">chmod-webpack-plugin</h1>
<p align="center">
    <a href="https://www.npmjs.com/package/chmod-webpack-plugin"><img src="https://img.shields.io/badge/npm-chmod--webpack--plugin-brightgreen.svg" /></a>
    <a href="https://www.npmjs.com/package/chmod-webpack-plugin"><img src="https://img.shields.io/npm/v/chmod-webpack-plugin.svg" /></a>
    <a href="https://www.npmjs.com/package/chmod-webpack-plugin"><img src="https://img.shields.io/npm/dt/chmod-webpack-plugin.svg" /></a>
    <a href="https://www.npmjs.com/package/chmod-webpack-plugin"><img src="https://img.shields.io/travis/xobotyi/chmod-webpack-plugin.svg" /></a>
    <a href="https://www.codacy.com/app/xobotyi/chmod-webpack-plugin"><img src="https://api.codacy.com/project/badge/Grade/2fdb90f167134d14b249bc9790d76175"/></a>
    <a href="https://www.codacy.com/app/xobotyi/chmod-webpack-plugin"><img src="https://api.codacy.com/project/badge/Coverage/2fdb90f167134d14b249bc9790d76175"/></a>
    <a href="https://www.npmjs.com/package/chmod-webpack-plugin"><img src="https://img.shields.io/npm/l/chmod-webpack-plugin.svg" /></a>
</p>

This plugin allows you to set files and directories permissions after bundle compilation.

## Installation
```bash
npm i --save chmod-webpack-plugin
```

## Example
```javascript
// webpack.conf.js
const ChmodWebpackPlugin = require("chmod-webpack-plugin");

module.exports = {
    plugins: [
        new ChmodWebpackPlugin([
                                   {path: "dist/dist/", mode: 660},
                                   {path: "dist/bin/**"},
                                   {path: "dist/public/", mode: 640},
                               ],
                               {
                                   verbose: true,
                                   mode:    770,
                               }),
    ],
};
```

## Usage
```javascript
// webpack.conf.js
const ChmodWebpackPlugin = require("chmod-webpack-plugin");

module.exports = {
    plugins:[
            new ChmodWebpackPlugin(config [, commonOptions])
    ]
}
```

#### config _(required)_
Object or array of objects
```javascript
const config = {
    // Required, string or array of strings
    // Globs that match files/paths to set permissions
    path,
    
    // Same as path parameter, but ,atched paths will will be ignored
    exclude:         [],
    
    // Path that will be treated as relative root for globs
    // By default it is a webpack's directory
    root:            path.dirname(module.parent.filename),
    
    // Permissions to set
    mode:            644,
    
    // If true will output the result of each matched path processing
    verbose:         false,
    
    // If true will not generate any console output (excepting errros)
    silent:          false,
    
    // If true will only emulate permissions change
    dryDun:          false,
    
    // If true only files will be processed
    filesOnly:       false,
    
    // If true only directories will be processed
    directoriesOnly: false, 
};
```

#### common options _(optional)_
Object of parameters tat will be used as default for all configs.  
Has the same structure with config entity, instead of `.path` parameter, which is ignored here.

## Tests
```bash
npm i
npm run test
```

## Coverage
```bash
npm i
npm run test:coverage
```
