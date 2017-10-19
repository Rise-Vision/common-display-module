const assert = require("assert");
const ipc = require('node-ipc');
const config = require("../../common.js");

describe("LMS", ()=>{
  describe("getMSClient", ()=>{
    before(()=>{
      ipc.serve( () => {

        ipc.server.on( "message", (data) => {
          ipc.server.broadcast(
              "message",
              data
          );
        });

        ipc.server.on("socket.disconnected", (socket, destroyedSocketID) => {
          ipc.log(`client ${destroyedSocketID} has disconnected!`);
        });
      });
    });

    it("should get the msClient object", ()=>{
      assert.notEqual(config.getMSClient("ID"), null);
    });
  });
});
