const common = require('./common');
const messaging = require('./messaging');

const displayConfigBucket = "risevision-display-notifications";

let watchMessagesAlreadySent = false;
let moduleName;
let logger;
let pathList;

function init(_moduleName, _logger, paths) {
  moduleName = _moduleName;
  logger = _logger;

  pathList = (typeof paths === 'string')? [paths] : paths;
}

function sendWatchMessagesIfNecessary(clientListMessage) {
  if (watchMessagesAlreadySent) {
    return Promise.resolve();
  }

  if (clientListMessage.clients.includes("local-storage")) {
    return Promise.all(pathList.map(path => sendWatchMessage(path)))
    .then(() => watchMessagesAlreadySent = true)
    .catch(error => logger.error(error.stack))
  }

  return Promise.resolve();
}


function sendWatchMessage(path) {
  return common.getDisplayId()
  .then(displayId =>
    messaging.broadcastMessage({
      from: moduleName,
      topic: "watch",
      filePath: `${displayConfigBucket}/${displayId}/${path}`
    })
  );
}

function isDeletedOrNoExist(message) {
  return ["DELETED", "NOEXIST"].includes(message.status);
}

function reset() {
  moduleName = null;
  logger = null;
  watchMessagesAlreadySent = false;
}

module.exports = {
  init,
  sendWatchMessage,
  sendWatchMessagesIfNecessary,
  isDeletedOrNoExist,
  reset
};
