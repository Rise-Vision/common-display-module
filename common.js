const path = require("path");
const {platform} = require("rise-common-electron");
const heartbeat = require("./heartbeat");
const portedPlatform = require("./platform");
const EventEmitter = require('events');
const HttpProxyAgent = require("proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
global.log = global.log || {error:console.log,debug:console.log};
let lmsClient = null, ipcConnection = null;
const ipc = require('node-ipc');

function getDisplaySettingsFileName() {
  return path.join(getInstallDir(), "RiseDisplayNetworkII.ini");
}

function connect(id) {
  if (ipcConnection) {
    return ipcConnection;
  }
  ipcConnection = new Promise((resolve)=>{
    if (lmsClient) {
      resolve(lmsClient);
    } else {
      ipc.config.id   = id;
      ipc.config.retry= 1500;
      ipc.config.silent = !process.argv.includes("--debug");

      ipc.connectTo(
          'lms',
          () => {
              ipc.of.lms.on(
                  'connect',
                  () => {
                      ipc.log('## connected to lms ##', ipc.config.id);
                      ipc.of.lms.emit("connected", {id: ipc.config.id, client: ipc.config.id});

                      lmsClient = {
                        broadcastMessage: (message) => {
                          ipc.of.lms.emit('message', message);
                        },
                        getClientList: () => {
                          ipc.of.lms.emit("clientlist-request");
                        },
                        toMessagingService: (message) => {
                          ipc.of.lms.emit("message", Object.assign({}, message, {through: "ms"}));
                        },
                        toLocalWS: (message) => {
                          ipc.of.lms.emit("message", Object.assign({}, message, {through: "ws"}));
                        },
                        receiveMessages: () => {
                          let receiver = new EventEmitter();
                          ipc.of.lms.on(
                              'message',
                              function(message){
                                  ipc.log('got a message from lms : ', message);
                                  receiver.emit("message",message);
                              }
                          );
                          return receiver;
                        }
                      }
                      resolve(lmsClient);
                  }
              );
              ipc.of.lms.on(
                  'disconnect',
                  function(){
                      ipc.log('disconnected from lms');
                  }
              );

              ipc.of.lms.on(
                  'error',
                  function(){
                      ipc.log('error from lms');
                  }
              );
          }
      );
    }
  });
  return ipcConnection;
}

function disconnect() {
  ipc.disconnect('lms');
  ipcConnection = null;
  lmsClient = null;
}

function broadcastMessage(message) {
  connect(message.from).then((client)=>{
    client.broadcastMessage(message);
  });
}

function broadcastToLocalWS(message) {
  connect(message.from).then((client)=>{
    client.toLocalWS(message);
  });
}

function getClientList(id) {
  connect(id).then((client)=>{
    client.getClientList();
  });
}

function receiveMessages(id) {
  return new Promise((resolve)=>{
    connect(id).then((client)=>{
      resolve(client.receiveMessages());

      heartbeat.startHearbeatInterval(id);
    });
  });
}

function sendToMessagingService(message) {
  connect(message.from).then((client)=>{
    client.toMessagingService(message);
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

function getProxyAgents() {
  const {HTTP_PROXY, HTTPS_PROXY} = process.env;
  const agents = {};

  if (HTTP_PROXY) {
    agents.httpAgent = new HttpProxyAgent(HTTP_PROXY);
  }
  if (HTTPS_PROXY) {
    agents.httpsAgent = new HttpsProxyAgent(HTTPS_PROXY);
  }

  return agents;
}

function getDisplayId() {
  return new Promise((res) => {
    module.exports.getDisplaySettings()
      .then(settings=>{
        if (!settings.displayid) {
          const tempDisplayId = "0." + module.exports.getMachineId();
          res(tempDisplayId);
        }

        res(settings.displayid);
      })
  });
}

function getLatestVersionInManifest() {
  const manifest = module.exports.getManifest();

  try {
    const latestModule = Object.keys(manifest)
      .filter(mod => manifest[mod].version && manifest[mod].version.startsWith("20"))
      .reduce((a, b) => { return manifest[a].version > manifest[b].version ? a : b });

    return manifest[latestModule].version;
  } catch(err) {
    log.debug(err.message);
    return "";
  }
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
  getDisplayId,
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
      log.debug(`No package json found for ${name}`);
      return {};
    }
  },
  getLatestVersionInManifest,
  connect,
  disconnect,
  broadcastMessage,
  broadcastToLocalWS,
  getClientList,
  sendToMessagingService,
  receiveMessages,
  getProxyAgents,
  moduleIsBackgroundTask(name) {
    return module.exports.getModulePackage(name).backgroundTask;
  },
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
  platform: portedPlatform,
  isBetaLauncher() {
    const betaPath = path.join(module.exports.getModulePath("launcher"), "Installer", "BETA");
    return platform.fileExists(betaPath);
  }
};
