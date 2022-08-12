<p align="center">
   <a href="https://github.com/bwp91/homebridge-govee"><img src="https://user-images.githubusercontent.com/43026681/101324574-5e997d80-3862-11eb-81b0-932330f6e242.png" width="600px"></a>
</p>
<span align="center">

# Homebridge-Ultimate-Govee
[![Node.js CI](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/node.js.yml/badge.svg)](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/node.js.yml) [![CodeQL](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/codeql-analysis.yml) [![Publish package to GitHub Packages](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/publish.yml/badge.svg)](https://github.com/constructorfleet/homebridge-ultimate-govee/actions/workflows/publish.yml)

A Homebridge plugin to provide comprehensive and intuitive control of Govee devices via Apple HomeKit.

</span>

## Plugin Information

- Supported Devices:
    - Air Purifiers (H7121, H7122)
        - Control Device Power
        - Control Device Fan Speed (Low, Medium, High, Night-mode)
        - Lock/Unlock the Physical Controls on the Device
    - Humidifiers (H7141, H7142)
        - Control Device Power
        - Control Device Mist Output Level
        - Reports When Device Water Level is Empty
    - RGBIC Lights
        - Control the entire light's brightness and color
        - Control each of the 15 segments' color and relative brightness individually
        - Toggle specific scenes/effects
- Required Information
    - Govee Account Credentials (Username, Password)

## Setup

### Development Environment

To develop Homebridge plugins you must have Node.js 14 or later installed, and a modern code editor such
as [VS Code](https://code.visualstudio.com/). This plugin template uses [TypeScript](https://www.typescriptlang.org/) to
make development easier and comes with pre-configured settings for [VS Code](https://code.visualstudio.com/) and ESLint.
If you are using VS Code install these extensions:

* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

#### Install Development Dependencies

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

```
npm install
```

#### Build Plugin

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of
your [`src`](./src) directory and put the resulting code into the `dist` folder.

```
npm run build
```

#### Link To Homebridge

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```
homebridge -D
```

#### Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes, and restart Homebridge automatically between
changes you can run:

```
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source
code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running
instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in
the [`nodemon.json`](./nodemon.json) file.

#### Versioning Your Plugin

Given a version number `MAJOR`.`MINOR`.`PATCH`, such as `1.4.3`, increment the:

1. **MAJOR** version when you make breaking changes to your plugin,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

You can use the `npm version` command to help you with this:

```bash
# major update / breaking changes
npm version major

# minor update / new features
npm version update

# patch / bugfixes
npm version patch
```

#### Publish Package

When you are ready to publish your plugin to [npm](https://www.npmjs.com/), make sure you have removed the `private`
attribute from the [`package.json`](./package.json) file then run:

```
npm publish
```

If you are publishing a scoped plugin, i.e. `@username/homebridge-xxx` you will need to add `--access=public` to command
the first time you publish.

#### Publishing Beta Versions

You can publish *beta* versions of your plugin for other users to test before you release it to everyone.

```bash
# create a new pre-release version (eg. 2.1.0-beta.1)
npm version prepatch --preid beta

# publsh to @beta
npm publish --tag=beta
```

Users can then install the  *beta* version by appending `@beta` to the install command, for example:

```
sudo npm install -g homebridge-example-plugin@beta
```

### Setup Plugin within Homebridge

#### Configuration Fields

`username` - Your Govee Home username  
`password` - Your Govee Home password

##### Connections

`ble` - Enable Bluetooth LE connections  
`iot` - Enable AWS IoT connections  
`rest` - Enable REST API connection

##### Device Overrides

These fields are available once the plugin has detected Govee devices associated with your account.

Once available, each device will display:

`deviceId` - The Govee device identifier (READ-ONLY)  
`model` - The Govee device model identifier (READ-ONLY)  
`ignore` - Check this box to prevent this device from being exposed to Apple HomeKit

RGBIC lights will also offer the ability to hide the segment lights from HomeKit, leaving the primary control:  
`hideSegments` - Setting to `true` will remove all 15 segments from HomeKit.  

## GraphQL HomeBridge API

Add the following to the 
