const MINUTES = 60000;
const DEFAULT_HEARTBEAT_INTERVAL = 4;

let timerId = null;
let messaging;

function setMessaging(_messaging) {
  messaging = _messaging;
}

const DEFAULT_BROADCAST_ACTION = message => {
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

function startHeartbeatInterval(moduleName, schedule = setInterval) {
  if(moduleName === 'watchdog' || moduleName === 'launcher') {
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

module.exports = {
  setBroadcastAction,
  setMessaging,
  startHeartbeatInterval,
  stop
};
