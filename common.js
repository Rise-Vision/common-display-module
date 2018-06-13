const path = require("path");
const {platform} = require("rise-common-electron");
const portedPlatform = require("./platform");
const HttpProxyAgent = require("proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
global.log = global.log || {error:console.log,debug:console.log};

function getDisplaySettingsFileName() {
  return path.join(getInstallDir(), "RiseDisplayNetworkII.ini");
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

function getTempDisplayId() {
  return "0." + module.exports.getMachineId();
}

function getDisplaySettingsSync() {
  var settings,
    configExists = platform.fileExists(getDisplaySettingsFileName()),
    textFileString = configExists ? platform.readTextFileSync(getDisplaySettingsFileName()) : "";

  if (!textFileString) {return {tempdisplayid: getTempDisplayId()};}

  settings = parsePropertyList(textFileString);

  if (!settings.displayid) {settings.tempdisplayid = getTempDisplayId();}

  return settings;
}

function getDisplayProperty(key) {
  return getDisplaySettings().then(settings => settings[key])
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
  getDisplayProperty,
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
