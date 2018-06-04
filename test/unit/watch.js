const assert = require("assert");
const simple = require("simple-mock");
const platform = require("rise-common-electron/platform");

const common = require("../../common");
const messaging = require("../../messaging");
const watch = require("../../watch");

describe("watch / Unit", () => {

  afterEach(() => {
    watch.reset();
    simple.restore();
  });

  describe("sendWatchMessagesOnce", () => {

    const logger = {error: simple.stub()};

    beforeEach(() => {
      simple.mock(messaging, "broadcastMessage").returnWith();
      simple.mock(common, "getDisplayId").resolveWith("DIS123");
    });

    it("should not send WATCH messages if no module is available", () => {
      watch.init('test-module', logger);

      return watch.sendWatchMessagesOnce({clients: []}, "content.json")
      .then(() => assert(!messaging.broadcastMessage.called));
    });

    it("should not send WATCH messages if local-storage module is not available", () => {
      watch.init('test-module', logger);

      return watch.sendWatchMessagesOnce({
        clients: ["logging", "system-metrics"]
      }, "content.json")
      .then(() => assert(!messaging.broadcastMessage.called));
    });

    it("should send WATCH message if local-storage module is available", () => {
      watch.init('test-module', logger);

      return watch.sendWatchMessagesOnce({
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
      watch.init('test-module', logger);

      return watch.sendWatchMessagesOnce({
        clients: ["logging", "system-metrics", "local-storage"]
      }, [
        "display.json", "content.json", "other.json"
      ])
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
      watch.init('test-module', logger);

      return watch.sendWatchMessagesOnce({
        clients: ["logging", "system-metrics", "local-storage"]
      }, [
        "display.json", "content.json", "other.json"
      ])
      .then(() => assert.equal(messaging.broadcastMessage.callCount, 3))
      .then(() =>
        watch.sendWatchMessagesOnce({
          clients: ["logging", "system-metrics", "local-storage"]
        }, [
          "display.json", "content.json", "other.json"
        ])
      )
      .then(() => assert.equal(messaging.broadcastMessage.callCount, 3));
    });

  });

  describe("sendWatchMessagesOnce", () => {

    it("should recognize deleted message", () => {
      const check = watch.isDeletedOrNoExist({status: "DELETED"});

      assert(check);
    });

    it("should recognize no exist message", () => {
      const check = watch.isDeletedOrNoExist({status: "NOEXIST"});

      assert(check);
    });

    it("should not recoginze CURRENT message as deleted", () => {
      const check = watch.isDeletedOrNoExist({status: "CURRENT"});

      assert(!check);
    });

  });

  describe("readTextContent", () => {

    const logger = {};

    beforeEach(() => watch.init('test-module', logger, "content.json"));

    it("should not execute action if file does not exist", () => {
      const message = {status: 'CURRENT', ospath: 'file.txt'};

      simple.mock(platform, "fileExists").returnWith(false);

      return watch.readTextContent(message)
      .then(content => assert(!content));
    });

    it("should execute action if file exist and could be read", () => {
      const message = {status: 'CURRENT', ospath: 'file.txt'};

      simple.mock(platform, "fileExists").returnWith(true);
      simple.mock(platform, "readTextFile").resolveWith("SAMPLE");

      return watch.readTextContent(message)
      .then(content => assert.equal(content, "SAMPLE"));
    });

    it("should fail if file exist but could not be read", () => {
      logger.error = simple.stub();
      const message = {status: 'CURRENT', ospath: 'file.txt'};

      simple.mock(platform, "fileExists").returnWith(true);
      simple.mock(platform, "readTextFile").rejectWith({stack: 'FAILURE'});

      return watch.readTextContent(message)
      .then(content => {
        assert(!content);

        assert.equal(logger.error.callCount, 1);
        assert.equal(logger.error.lastCall.args[0], 'FAILURE');
      });
    });

  });

});
