const ipc = require('node-ipc');
const assert = require("assert");

const heartbeat = require("../../heartbeat");
const licensing = require("../../licensing");
const messaging = require("../../messaging");

describe("Licensing - Integration", () => {

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

  afterEach(() => {
    heartbeat.stop()
    ipc.server.stop();
    messaging.disconnect();
  });

  it("should broadcast licensing request", done => {
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
                        assert.deepEqual(message, {
                          from: "broadcaster", topic: "licensing-request"
                        });

                        done();
                      }
                  );
                }
            );
        }
    );

    licensing.requestLicensingData("broadcaster");
  });

});
