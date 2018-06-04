const common = require('./common');
const messaging = require('./messaging');

const displayConfigBucket = "risevision-display-notifications";

let watchMessagesAlreadySent = false;
let moduleName;
let logger;

function init(_moduleName, _logger) {
  moduleName = _moduleName;
  logger = _logger;
}

function sendWatchMessagesIfNecessary(clientListMessage, paths) {
  if (watchMessagesAlreadySent) {
    return Promise.resolve();
  }

  const pathList = (typeof paths === 'string')? [paths] : paths;

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

function reset() {
  moduleName = null;
  logger = null;
  watchMessagesAlreadySent = false;
}

module.exports = {init, sendWatchMessage, sendWatchMessagesIfNecessary, reset};
