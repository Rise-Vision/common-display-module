const ipc = require('node-ipc');
const assert = require("assert");

const heartbeat = require("../../heartbeat");
const messaging = require("../../messaging");

describe("Messaging", ()=>{

    afterEach(() => heartbeat.stop());
    
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

            ipc.server.on( "clientlist-request", (data, socket) => {
              ipc.server.emit(
                socket,
                "message",
                {topic: "client-list", clients: ["client1", "client2"]}
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

      it("should get the msClient object", ()=>{
        assert.notEqual(messaging.connect(), null);
      });

      it("should emit 'connected' upon connection", (done)=>{
        const connectedHandler = (data) => {
          assert.deepEqual(data, {id: "broadcaster", client: "broadcaster"});
          ipc.server.off("connected", connectedHandler);
          done();
        };

        ipc.server.on( "connected", connectedHandler);

        messaging.connect("broadcaster");
      });

      it("should broadcast message ", (done)=>{
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
        messaging.broadcastMessage({from: "broadcaster", topic: "message1"});
      });

      it("should broadcast message to ms ", (done)=>{
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
                            assert.deepEqual(message, {through: "ms", from: "broadcaster", topic: "watch", data:{}});
                            done();
                          }
                      );
                    }
                );
            }
        );
        messaging.sendToMessagingService({from: "broadcaster", topic: "watch", data:{}});
      });

      it("should broadcast message to ws", (done)=>{
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
                    assert.deepEqual(message, {through: "ws", from: "broadcaster", topic: "FILE-UPDATE", data:{}});
                    done();
                  }
                );
              }
            );
          }
        );
        messaging.broadcastToLocalWS({from: "broadcaster", topic: "FILE-UPDATE", data:{}});
      });

      it("should get the message from receiveMessages", (done)=>{
        messaging.receiveMessages().then((receiver)=>{
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

      it("should get the client list from receiving message with topic 'client-list'", (done)=>{
        messaging.receiveMessages("broadcaster")
          .then((receiver)=>{
            receiver.on("message", (message) => {
              assert.deepEqual(message, {topic: "client-list", clients: ["client1", "client2"]});
              done();
            });
          })
          .then(messaging.getClientList("broadcaster"));
      });

      it("should broadcast message even though there is a disconnection", (done)=>{
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
        messaging.broadcastMessage({from: "broadcaster2", topic: "message3"});
        ipc.server.start();
      });
    });
  });