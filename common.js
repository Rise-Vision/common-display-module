const path = require("path");
const {platform} = require("rise-common-electron");
const EventEmitter = require('events');
global.log = global.log || {error:console.log,debug:console.log};
let msClient = null;

function getDisplaySettingsFileName() {
  return path.join(getInstallDir(), "RiseDisplayNetworkII.ini");
}

function getLMSClient(id) {
  return new Promise((resolve)=>{
    if (msClient) {
      resolve(msClient);
    } else {
      const ipc = require('node-ipc');
      ipc.config.id   = id;
      ipc.config.retry= 1500;

      ipc.connectTo(
          'ms',
          function(){
              ipc.of.ms.on(
                  'connect',
                  function(){
                      ipc.log('## connected to ms ##', ipc.config.delay);
                      msClient = {
                        broadcastMessage: (message) => {
                          ipc.of.ms.emit('message', message)
                        },
                        receiveMessages: () => {
                          return new Promise((resolve)=>{
                            let receiver = new EventEmitter();
                            ipc.of.ms.on(
                                'message',
                                function(message){
                                    ipc.log('got a message from ms : ', message);
                                    receiver.emit("message",message);
                                }
                            );
                            resolve(receiver);
                          });
                        }
                      }
                      resolve(msClient);
                  }
              );
              ipc.of.ms.on(
                  'disconnect',
                  function(){
                      ipc.log('disconnected from ms');
                  }
              );
          }
      );
    }
  });
}

function getDisplaySettings() {
  return new Promise((resolve)=>{
    platform.readTextFile(getDisplaySettingsFileName())
      .then((contents)=>{
        resolve(parsePropertyList(contents));
      })
      .catch(()=>{
        resolve({});
      });
  });
}

function getDisplaySettingsSync() {
  var settings,
    tempDisplayId = "0." + module.exports.getMachineId(),
    configExists = platform.fileExists(getDisplaySettingsFileName()),
    textFileString = configExists ? platform.readTextFileSync(getDisplaySettingsFileName()) : "";

  if (!textFileString) {return {tempdisplayid: tempDisplayId};}

  settings = parsePropertyList(textFileString);

  if (!settings.displayid) {settings.tempdisplayid = tempDisplayId;}

  return settings;
}

function getInstallDir() {
  return path.join(platform.getHomeDir(), "rvplayer");
}

function parsePropertyList(list) {
  var result = {};
  list.split("\n").forEach((line)=>{
    if (line.indexOf("=") < 0) {return;}
    var vals = line.trim().split("=");
    result[vals[0]] = vals[1];
  });

  return result;
}

function getMachineIdPath() {
  return path.join(module.exports.getInstallDir(), "machineid");
}

module.exports = {
  getMachineIdPath,
  getMachineId() {
    try {
      return platform.readTextFileSync(getMachineIdPath());
    } catch(e) {
      log.debug(e.message);
      return "";
    }
  },
  deleteFile(fileName, version, cb) {
    const filePath = path.join(module.exports.getInstallDir(version), fileName);
    return platform.callRimraf(filePath, cb);
  },
  fileExists(fileName, version) {
    const filePath = path.join(module.exports.getInstallDir(version), fileName);
    return platform.fileExists(filePath);
  },
  getDisplaySettingsFileName,
  getDisplaySettings,
  getDisplaySettingsPath() {
    return path.join(module.exports.getInstallDir(), "RiseDisplayNetworkII.ini");
  },
  getDisplaySettingsSync,
  getInstallDir,
  getScriptDir() {
    return path.join(module.exports.getInstallDir(), "scripts");
  },
  getManifestPath() {
    return path.join(module.exports.getInstallDir(), "module-manifest.json");
  },
  getManifest() {
    let manifest;
    try {
      return JSON.parse(platform.readTextFileSync(module.exports.getManifestPath()));
    } catch(e) {
      log.debug("No local manifest present");
      return {};
    }
  },
  getModuleDir() {
    return path.join(module.exports.getInstallDir(), "modules");
  },
  getModuleVersion(name) {
    const moduleManifestEntry = module.exports.getManifest()[name];
    return moduleManifestEntry && moduleManifestEntry.version;
  },
  getModulePath(name) {
    const moduleVersion = module.exports.getModuleVersion(name);
    if (!moduleVersion) {
      log.error(`No version found for ${name}`);
      return false;
    }

    return path.join(module.exports.getModuleDir(), name, moduleVersion);
  },
  getModulePackage(name) {
    const modulePath = module.exports.getModulePath(name);

    if (!modulePath) {
      log.error(`No path found for ${name}`);
      return {};
    }

    try {
      return JSON.parse(platform.readTextFileSync(path.join(modulePath, "package.json")));
    } catch(e) {
      log.error(`No package json found for ${name}`);
      return {};
    }
  },
  getLMSClient,
  moduleUsesElectron(name) {
    return module.exports.getModulePackage(name).useElectron;
  },
  parsePropertyList,
  readFile(fileName, version) {
    const filePath = path.join(module.exports.getInstallDir(version), fileName);
    return platform.readTextFileSync(filePath);
  },
  writeFile(fileName, data, version) {
    const filePath = path.join(module.exports.getInstallDir(version), fileName);
    return platform.writeTextFileSync(filePath, data);
  },
};
