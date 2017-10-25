const assert = require("assert");
const fs = require("fs");
const {join: pathJoin} = require("path");
const platform = require("rise-common-electron").platform;
const config = require("../../common.js");
const ipc = require('node-ipc');


describe("Config", ()=>{
  describe("when local module manifest is not present", ()=>{
    beforeEach(()=>{
      try {
        fs.unlinkSync(config.getManifestPath());
      } catch(e) {
        console.log(e);
      }
    });

    it("initializes empty local display module manifest", ()=>{
      console.log(config.getManifest());
      assert.deepEqual(config.getManifest(), {});
    });
  });

  describe("when local module manifest is present", ()=>{
    beforeEach(()=>{
      platform.writeTextFileSync(config.getManifestPath(), `{"test":{"version": "01.01"}}`);
    });
    afterEach(()=>{
      fs.unlinkSync(config.getManifestPath());
    });

    it("retrieves local display module manifeset", ()=>{
      assert.deepEqual(config.getManifest(), {test:{version:"01.01"}});
    });
  });

  describe("when a module is installed and contains a package.json", ()=>{
    beforeEach(()=>{
      platform.writeTextFileSync(config.getManifestPath(), `{"test":{"version": "01.01"}}`);
      platform.writeTextFileSync(pathJoin(config.getModulePath("test"), "package.json"), `{"useElectron":true, "backgroundTask":true}`);
    });

    afterEach(()=>{
      fs.unlinkSync(pathJoin(config.getModulePath("test"), "package.json"));
      fs.unlinkSync(pathJoin(config.getManifestPath()));
    });

    it("indicates whether a module uses Electron or not", ()=>{
      assert.equal(config.moduleUsesElectron("test"), true);
    });

    it("indicates whether a module is a background task or not", ()=> {
      assert.equal(config.moduleIsBackgroundTask("test"), true);
    });
  });

  describe("when a module is installed and doesn't contain a package.json", ()=>{
    beforeEach(()=>{
      platform.writeTextFileSync(config.getManifestPath(), `{"test":{"version": "01.01"}}`);

      try {
        fs.unlinkSync(pathJoin(config.getModulePath("test"), "package.json"));
      } catch(e) {
        console.log(e);
      }
    });

    afterEach(()=>{
      fs.unlinkSync(pathJoin(config.getManifestPath()));
    });

    it("indicates whether a module uses Electron or not", ()=>{
      assert(!config.moduleUsesElectron("test"));
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

      it("should get the msClient object", ()=>{
        assert.notEqual(config.connect(), null);
      });

      xit("should broadcast meassage ", (done)=>{
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
                            assert.deepEqual(message, {from: "broadcaster", topic: "message1"});
                            done();
                          }
                      );
                    }
                );
            }
        );
        config.broadcastMessage({from: "broadcaster", topic: "message1"});
      });

      it("should get the message from receiveMessages", (done)=>{
        config.receiveMessages().then((receiver)=>{
          receiver.on("message", (message) => {
            assert.equal(message, "message2");
            done();
          });
        });
        ipc.config.id   = "receiver";
        ipc.connectTo(
            'lms',
            function(){
                ipc.of.lms.on(
                    'connect',
                    function(){
                      ipc.of.lms.emit('message', "message2");
                    }
                );
            }
        );
      });

      it("should broadcast meassage even though there is a disconnection", (done)=>{
        ipc.server.stop();
        ipc.config.id   = "broadcastReceiver2";
        ipc.connectTo(
            'lms',
            function(){
                ipc.of.lms.on(
                    'connect',
                    function(){
                      ipc.of.lms.on(
                          'message',
                          function(message){
                            assert.deepEqual(message, {from: "broadcaster2", topic: "message3"});
                            done();
                          }
                      );
                    }
                );
            }
        );
        config.broadcastMessage({from: "broadcaster2", topic: "message3"});
        ipc.server.start();
      });
    });
  });
});
