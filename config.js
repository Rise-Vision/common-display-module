const machineId = require("./machine-id.js"),
  path = require("path"),
  platform = require("rise-common-electron").platform;

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

function getDisplaySettingsSync() {
  var settings,
    tempDisplayId = "0." + machineId(),
    configExists = platform.fileExists(getDisplaySettingsFileName()),
    textFileString = configExists ? platform.readTextFileSync(getDisplaySettingsFileName()) : "";

  if (!textFileString) {return {tempdisplayid: tempDisplayId};}

  settings = parsePropertyList(textFileString);

  if (!settings.displayid) {settings.tempdisplayid = tempDisplayId;}

  return settings;
}

function getInstallDir(version) {
  return path.join(platform.getHomeDir(), "rvplayer", version || "");
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

module.exports = {
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
  getModuleVersion(moduleName) {
    let localManifest = module.exports.getManifest();

    return (localManifest.modules[moduleName]) ? localManifest.modules[moduleName].version : "";
  },
  getScriptsDir(version) {
    return path.join(module.exports.getInstallerDir(version), "scripts");
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