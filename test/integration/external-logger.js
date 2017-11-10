const assert = require("assert");
const config = require("../../common.js");
const ipc = require('node-ipc');

describe("External Logger", ()=>{
  describe("initialization", ()=>{
    it("should create an instance of external-logger with a log function", ()=>{
      const externalLogger = require('../../external-logger')("A", "B", "C");
      assert.deepEqual(externalLogger.hasOwnProperty("log"), true);
    });
  });

  describe("LMS", ()=>{
    describe("connect", ()=>{
      beforeEach((done)=>{
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
        config.disconnect();
      });

      it("should broadcast log message to ms for loggig module", (done)=>{
        const externalLogger = require('../../external-logger')("projectName", "databaseName", "testFile");

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
                            var expectedObject = {
                                                  topic: 'log',
                                                  data: {
                                                    projectName: 'projectName',
                                                    datasetName: 'databaseName',
                                                    failedEntryFile: 'testFile',
                                                    table: 'testTable',
                                                    data: {}
                                                  }
                                                };
                            assert.deepEqual(message, expectedObject);
                            done();
                          }
                      );
                    }
                );
            }
        );
        externalLogger.log("testTable", {});
      });
    });
  });
});
