

const MINUTES = 60000;
const DEFAULT_HEARTBEAT_INTERVAL = 4;

let timerId = null;

const DEFAULT_BROADCAST_ACTION = message => {
  // nested require to avoid circular dependency problem.
  const messaging = require("./messaging");

  messaging.broadcastMessage(message);
}

let broadcastAction = DEFAULT_BROADCAST_ACTION;

function setBroadcastAction(action) {
  broadcastAction = action ? action : DEFAULT_BROADCAST_ACTION;
}

// Can be set via environment variable HEARTBEAT_INTERVAL, which is useful for testing purposes.
// Should not be set to more than the WATCH_INTERVAL in watchdog-module.
function getHeartbeatInterval() {
  const value = Number(process.env.HEARTBEAT_INTERVAL || DEFAULT_HEARTBEAT_INTERVAL);

  return value * MINUTES;
}

function startHearbeatInterval(moduleName, schedule = setInterval) {
  // watchdog module does not send heartbeats.
  if(moduleName === 'watchdog') {
    return;
  }

  // safety catch, stop any previous execution.
  stop();

  const interval = getHeartbeatInterval();
  const message = {from: moduleName, topic: "heartbeat"};

  timerId = schedule(() => broadcastAction(message), interval);
}

function stop() {
  if (timerId) {
    clearInterval(timerId);

    timerId = null;
  }
}

module.exports = {setBroadcastAction, startHearbeatInterval, stop};
