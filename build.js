var client = require('phonegap-build-api');
var Promise = require('bluebird');
var fs = require('fs');

// ============= Configurations ============
var username = '';                  // AdobeID Username (email)
var password = '';                  // AdobeID Password
var appID = '';                     // Find this in the fine print for your app at https://build.phonegap.com/apps
var outputDir = '';                 // Example: '/Users/bob/Desktop/'. Include trailing slash.
var iospass = '';                   // Password for iOS Key
var androidkeypass = '';            // Password for Android Key
var androidkeystorepass = '';       // Password for Android Keystore
// =========================================

var check = '  \033[92m' + ' \u2713   \033[0m';
var fail = '  \033[91mX  ';
var appName = '';
var androidID = '';
var iosID = '';
var version = '';

client.auth({ username: username, password: password }, function(e, api) {
    if (e) {
        console.log(fail + 'Authentication failure:\n', e);
        return;
    } else console.log(check + 'Authenticated');
    apps(api, appID)
        .then(function(data) {
            console.log(check + 'App Detected');
            iosID = data.keys.ios.id;
            androidID = data.keys.android.id;
            appName = data.title + '-';
            return pull(api, appID);
        })
        .then(function(pull) {
            console.log(check + 'Code Pulled');
            version = pull.version;
            return unlockiOS(api, iosID, iospass);
        })
        .then(function(unlock) {
            if (!unlock.locked) {
                console.log(check + 'iOS Unlocked');
                return unlockAndroid(api, androidID, androidkeypass, androidkeystorepass);
            }
        })
        .then(function(unlock) {
            if (!unlock.locked) {
                console.log(check + 'Android Unlocked');
                return build(api, appID);
            }
        })
        .then(function(build) {
            console.log(check + 'Build Executed');
            return checkBuild(api, appID, 0);
        })
        .then(function(ret) {
            console.log(check + 'Code Built');
            return downloadAndroid(api, appID, version, appName, outputDir);
        })
        .then(function(ret) {
            console.log(check + 'Android Downloaded');
            return downloadiOS(api, appID, version, appName, outputDir);
        })
        .then(function(ret) {
            console.log(check + 'iOS Downloaded');
            console.log(check + 'Complete');
        })
        .catch(function(e) {
            console.log(fail + e + ' \033[0m');
        });
});

function apps(api, id) {
    return new Promise(function(resolve, reject) {
        api.get('/apps/' + id, function(e, data) {
            if (e) reject('Get App Info Error: \n', e);
            if (data) return resolve(data);
            else return reject();
        });
    });
}

function pull(api, id) {
    return new Promise(function(resolve, reject) {
        var options = {form: {data: {pull: true}}};
        api.put('/apps/' + id, options, function(e, data) {
            if (e) reject('Pull Error: \n', e);
            else return resolve(data);
        });
    });
}

function unlockiOS(api, id, pass) {
    return new Promise(function(resolve, reject) {
        var options = {form: {data: {password: pass}}};
        api.put('/keys/ios/' + id, options, function(e, data) {
            if (e) reject('Unlock iOS Error: \n', e);
            else return resolve(data);
        });
    });
}

function unlockAndroid(api, id, keypass, keystorepass) {
    return new Promise(function(resolve, reject) {
        var options = {form: {data: {key_pw: keypass, keystore_pw: keystorepass}}};
        api.put('/keys/android/' + id, options, function(e, data) {
            if (e) reject('Unlock Android Error: \n', e);
            else return resolve(data);
        });
    });
}

function build(api, id) {
    return new Promise(function(resolve, reject) {
        api.post('/apps/' + id + '/build', function(e, data) {
            if (e) reject('Build Error: \n', e);
            else return resolve(data);
        });
    });
}

function checkBuild(api, id, num) {
    return new Promise(function(resolve, reject) {
        if (num > 20) return reject('checkBuild Limit reached');
        Promise.delay(10000)
            .then(function() {
                api.get('/apps/' + id, function(e, data) {
                    num += 1;
                    console.log('         Checking... (' + num + '/20)');
                    if (e) reject('checkBuild Error: \n', e);
                    if (data && data.status.android == 'complete' && data.status.ios == 'complete') {
                        return resolve(data);
                    } else {
                        return resolve(checkBuild(api, id, num));
                    }
                });
            });
    });
}

function downloadAndroid(api, id, version, name, dir) {
    return new Promise(function(resolve, reject) {
        api.get('/apps/' + id + '/android').pipe(fs.createWriteStream(dir + name + 'v' + version + '.apk'));
        resolve();
    });
}

function downloadiOS(api, id, version, name, dir) {
    return new Promise(function(resolve, reject) {
        api.get('/apps/' + id + '/ios').pipe(fs.createWriteStream(dir + name + 'v' + version + '.ipa'));
        resolve();
    });
}
