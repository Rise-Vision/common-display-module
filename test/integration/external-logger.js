const assert = require("assert");
const ipc = require('node-ipc');
const simpleMock = require("simple-mock");

const messaging = require("../../messaging.js");
const mock = simpleMock.mock;

describe("External Logger", ()=>{
  describe("initialization", ()=>{
    it("should create an instance of external-logger with a log function", ()=>{
      const externalLogger = require('../../external-logger')("A", "B", "C");
      assert.deepEqual(externalLogger.hasOwnProperty("log"), true);
      assert(externalLogger.hasOwnProperty("setDisplaySettings"));
    });
  });

  describe("message configuration for LM", ()=>{
    beforeEach(()=>{
      externalLogger = require('../../external-logger')("projectName", "datasetName", "testFile");
      externalLogger.setDisplaySettings({displayid: "abc123"});
      spy = mock(console, 'log');
    });

    afterEach(()=>{
      simpleMock.restore();
    });

    it("should not send message to LM and log error if message.from is null", ()=>{
      externalLogger.log("testEvent", {"detail": "testDetail"}, "testTable", "");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - source module undefined: From is required");
    });

    it("should not send message to LM and log error if message.data.table is null", ()=>{
      externalLogger.log("testEvent", {"detail": "testDetail"}, "", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ table is required");
    });

    it("should not send message to LM and log error if message.data.detail is null", ()=>{
      externalLogger.log("testEvent", {}, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ detail is required");
    });

    it("should not send message to LM and log error if message.data.event is null", ()=>{
      externalLogger.log("", {"detail": "testDetail"}, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ event is required");
    });

    it("should not send message to LM and log error if message.data.projectName is null", ()=>{
      const externalLogger = require('../../external-logger')("", "datasetName", "testFile");
      externalLogger.log("testEvent", {"detail": "testDetail"}, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ project name is required");
    });

    it("should not send message to LM and log error if message.data.datasetName is null", ()=>{
      const externalLogger = require('../../external-logger')("projectName", "", "testFile");
      externalLogger.log("testEvent", {"detail": "testDetail"}, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ dataset name is required");
    });

    it("should not send message to LM and log error if message.data.failedEntryFile is null", ()=>{
      const externalLogger = require('../../external-logger')("projectName", "datasetName", "");
      externalLogger.log("testEvent", {"detail": "testDetail"}, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ failed entry file is required");
    });

    it("should not send message to LM and log error if detail is null", ()=>{
      const externalLogger = require('../../external-logger')("projectName", "datasetName", "testFile");
      externalLogger.log("testEvent", null, "testTable", "integrationTest");
      assert.deepEqual(spy.lastCall.arg, "external-logger error - integrationTest: BQ detail is required");
    });
  });

  describe("LMS", ()=>{
    describe("connect", ()=>{
      beforeEach((done)=>{
        externalLogger = require('../../external-logger')("projectName", "datasetName", "testFile");

        ipc.config.id   = "lms";
        let doneCalled = false;
        ipc.serve( () => {
          if(!doneCalled){
            doneCalled = true;
            done();

            ipc.server.on( "message", (data) => {
              ipc.server.broadcast(
                  "message",
                  data
              );
            });

            ipc.server.on("socket.disconnected", (socket, destroyedSocketID) => {
              ipc.log(`client ${destroyedSocketID} has disconnected!`);
            });
          }
        });

        ipc.server.start();
      });

      afterEach(()=>{
        ipc.server.stop();
        messaging.disconnect();
      });

      it("should broadcast log message to ms for logging module", (done)=>{
        ipc.config.id   = "broadcastReceiver";
        ipc.connectTo(
            'lms',
            function(){
                ipc.of.lms.on(
                    'connect',
                    function(){
                      ipc.of.lms.on(
                          'message',
                          function(message){
                            let expectedMessage = {
                              topic: 'log',
                              from: 'testFrom',
                              data: {
                                'projectName': 'projectName',
                                'datasetName': 'datasetName',
                                'failedEntryFile': 'testFile',
                                'table': 'testTable',
                                'data': {
                                  'event': 'testEvent',
                                  "event_details": "test-details",
                                  "display_id": "abc123"
                                }
                              }
                            };
                            assert.deepEqual(message, expectedMessage);
                            done();
                          }
                      );
                    }
                );
            }
        );

        externalLogger.log("testEvent", {"event_details": "test-details"}, "testTable", "testFrom");
      });
    });
  });
});
