const path = require("path");
const crypto = require("crypto");
const platform = require("rise-common-electron").platform;
const common = require("./common");

function getHashedFileName(componentId) {
  if (!componentId) {throw Error("data-save - missing componentId param");}

  return crypto.createHash("md5").update(componentId).digest("hex");
}

function getPathToCacheDir(moduleName) {
  return path.join(common.getModuleDir(), moduleName, "data-save");
}

function getPathToFile(moduleName, componentId) {
  return path.join(getPathToCacheDir(moduleName), getHashedFileName(componentId));
}

module.exports = (moduleName)=>{
  return {
    init() {
      return platform.mkdir(getPathToCacheDir(moduleName));
    },
    putFile(componentId, data) {
      return new Promise((resolve, reject)=>{
        platform.writeTextFile(getPathToFile(moduleName, componentId), data)
        .then(()=>{
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
      });
    },
    getFile(componentId) {
      return new Promise((resolve, reject)=>{
        const pathToFile = getPathToFile(moduleName, componentId);

        if (platform.fileExists(pathToFile)) {
          platform.readTextFile(pathToFile)
          .then((data)=>{
            resolve(data);
          })
          .catch((error)=>{
            reject(error);
          });
        } else {
          log.debug(`data-save - GETFILE : file does not exist at ${pathToFile}`);
          resolve("");
        }
      });
    },
    removeFile(componentId) {
      return new Promise((resolve, reject)=>{
        const pathToFile = getPathToFile(moduleName, componentId);

        if (platform.fileExists(pathToFile)) {
          platform.deleteRecursively(pathToFile)
          .then(()=>{
            resolve();
          })
          .catch((error)=>{
            reject(error);
          });
        } else {
          log.debug(`data-save - REMOVEFILE : file does not exist at ${pathToFile}`);
          resolve();
        }
      });
    }
  }
}
