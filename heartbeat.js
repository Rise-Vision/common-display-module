const common = require("./common");

const MINUTES = 60000;
const DEFAULT_HEARTBEAT_INTERVAL = 4;

let timerId = null

// Can be set via environment variable HEARBEAT_INTERVAL, which is useful for testing purposes.
// Should not be set to more than the WATCH_INTERVAL in watchdog-module.
function getHeartbeatInterval() {
  const value = Number(process.env.HEARBEAT_INTERVAL || DEFAULT_HEARTBEAT_INTERVAL);

  return value * MINUTES;
}

function startHearbeatInterval(moduleName, schedule = setInterval) {
  // safety catch, stop any previous execution.
  stop()

  const interval = getHeartbeatInterval();
  const message = {from: moduleName, topic: "heartbeat"};

  timerId = schedule(() => common.broadcastMessage(message), interval);
}

function stop() {
  if (timerId) {
    clearInterval(timerId)

    timerId = null
  }
}

module.exports = {startHearbeatInterval, stop};
