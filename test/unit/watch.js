const assert = require("assert");
const simple = require("simple-mock");

const common = require("../../common");
const messaging = require("../../messaging");
const watch = require("../../watch");

describe("watch / Unit", () => {

  const logger = {error: simple.stub()};

  beforeEach(() => {
    simple.mock(messaging, "broadcastMessage").returnWith();
    simple.mock(common, "getDisplayId").resolveWith("DIS123");

    watch.init('test-module', logger);
  });

  afterEach(() => {
    watch.reset();
    simple.restore();
  });

  it("should not send WATCH messages if no module is available", () => {
    return watch.sendWatchMessagesIfNecessary({clients: []}, "content.json")
    .then(() => assert(!messaging.broadcastMessage.called));
  });

  it("should not send WATCH messages if local-storage module is not available", () => {
    return watch.sendWatchMessagesIfNecessary({
      clients: ["logging", "system-metrics"]
    }, "content.json")
    .then(() => assert(!messaging.broadcastMessage.called));
  });

  it("should send WATCH message if local-storage module is available", () => {
    return watch.sendWatchMessagesIfNecessary({
      clients: ["logging", "system-metrics", "local-storage"]
    }, "content.json")
    .then(() => {
      assert.equal(messaging.broadcastMessage.callCount, 1);
      const event = messaging.broadcastMessage.lastCall.args[0];

      assert(event);
      assert.equal(event.from, "test-module");
      assert.equal(event.topic, "watch");
      assert.equal(event.filePath, "risevision-display-notifications/DIS123/content.json");
    });
  });

  it("should send WATCH messages if local-storage module is available", () => {
    return watch.sendWatchMessagesIfNecessary({
      clients: ["logging", "system-metrics", "local-storage"]
    }, ["display.json", "content.json", "other.json"])
    .then(() => {
      assert(messaging.broadcastMessage.called);
      assert.equal(messaging.broadcastMessage.callCount, 3);

      const pathRegex =
        new RegExp('^risevision-display-notifications/DIS123/(display|content|other).json$')

      messaging.broadcastMessage.calls.forEach(call => {
        const event = call.args[0];

        assert(event);
        assert.equal(event.from, "test-module");
        assert.equal(event.topic, "watch");
        assert.ok(pathRegex.test(event.filePath));
      });
    });
  });

  it("should send WATCH messages only once", () => {
    return watch.sendWatchMessagesIfNecessary({
      clients: ["logging", "system-metrics", "local-storage"]
    }, ["display.json", "content.json", "other.json"])
    .then(() => assert.equal(messaging.broadcastMessage.callCount, 3))
    .then(() =>
      watch.sendWatchMessagesIfNecessary({
        clients: ["logging", "system-metrics", "local-storage"]
      }, ["display.json", "content.json", "other.json"])
    )
    .then(() => assert.equal(messaging.broadcastMessage.callCount, 3));
  });

});
