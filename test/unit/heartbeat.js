const assert = require("assert");
const simple = require("simple-mock");

const common = require("../../common");
const heartbeat = require("../../heartbeat");

describe("Heartbeat - Unit", ()=>
{

  beforeEach(() => {
    simple.mock(common, "broadcastMessage").returnWith();
  });

  afterEach(()=> {
    simple.restore()
    heartbeat.setBroadcastAction(null);
  });

  it("should schedule heartbeat events", () => {
    heartbeat.startHearbeatInterval("test-module", (action, interval) => {
      assert.equal(interval, 240000);

      action();

      assert(common.broadcastMessage.called);

      const event = common.broadcastMessage.lastCall.args[0];

      assert.equal(event.from, "test-module");
      assert.equal(event.topic, "heartbeat");
    })
  });

  it("should let change the broadcast action", done => {
    heartbeat.setBroadcastAction(message =>
    {
      assert.equal(message.from, "test-module");
      assert.equal(message.topic, "heartbeat");

      done();
    });

    heartbeat.startHearbeatInterval("test-module", (action, interval) => {
      assert.equal(interval, 240000);

      action();
    })
  });

});
