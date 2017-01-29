# phonegap-build-script

This is a simple script for [Phonegap Build](https://build.phonegap.com/). Its purpose is to be a build script for developers who use git repos with Phonegap Build to compile binaries of their apps. It accomplishes the following, using javascript promises for good measure:

1. Trigger Phonegap Build to pull the latest code from a preconfigured git repo
2. Submit the unlock keys for both Android and iOS
3. Trigger a build
4. Check the build progress until both Android and iOS platforms are complete
5. Download the final output builds, appended by the version number contained in the repo's config.xml

Using this script, a dev may easily build and download binaries of their phonegap project. Feel free to fork!


## Prerequisites

Requires [BluebirdJS](https://www.npmjs.com/package/bluebird) and [phonegap-build-api](https://www.npmjs.com/package/phonegap-build-api).

```
npm install phonegap-build-api bluebird
```

## Running

First, open `build.js` and input the required parameters. Then:

```
node build.js
```
