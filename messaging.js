const ipc = require('node-ipc');
const EventEmitter = require('events');

const heartbeat = require("./heartbeat");

let lmsClient = null, ipcConnection = null;

function connect(id) {
  if (ipcConnection) {
    return ipcConnection;
  }
  ipcConnection = new Promise((resolve)=>{
    if (lmsClient) {
      resolve(lmsClient);
    } else {
      ipc.config.id   = id;
      ipc.config.retry= 1500;
      ipc.config.silent = !process.argv.includes("--debug");

      ipc.connectTo(
          'lms',
          () => {
              ipc.of.lms.on(
                  'connect',
                  () => {
                      ipc.log('## connected to lms ##', ipc.config.id);
                      ipc.of.lms.emit("connected", {id: ipc.config.id, client: ipc.config.id});

                      lmsClient = {
                        broadcastMessage: (message) => {
                          ipc.of.lms.emit('message', message);
                        },
                        getClientList: () => {
                          ipc.of.lms.emit("clientlist-request");
                        },
                        toMessagingService: (message) => {
                          ipc.of.lms.emit("message", Object.assign({}, message, {through: "ms"}));
                        },
                        toLocalWS: (message) => {
                          ipc.of.lms.emit("message", Object.assign({}, message, {through: "ws"}));
                        },
                        receiveMessages: () => {
                          let receiver = new EventEmitter();
                          ipc.of.lms.on(
                              'message',
                              function(message){
                                  ipc.log('got a message from lms : ', message);
                                  receiver.emit("message",message);
                              }
                          );
                          return receiver;
                        }
                      }
                      resolve(lmsClient);
                  }
              );
              ipc.of.lms.on(
                  'disconnect',
                  function(){
                      ipc.log('disconnected from lms');
                  }
              );

              ipc.of.lms.on(
                  'error',
                  function(){
                      ipc.log('error from lms');
                  }
              );
          }
      );
    }
  });
  return ipcConnection;
}

function disconnect() {
  ipc.disconnect('lms');
  ipcConnection = null;
  lmsClient = null;
}

function broadcastMessage(message) {
  return connect(message.from).then((client)=>{
    client.broadcastMessage(message);
  });
}

function broadcastToLocalWS(message) {
  return connect(message.from).then((client)=>{
    client.toLocalWS(message);
  });
}

function getClientList(id) {
  return connect(id).then((client)=>{
    client.getClientList();
  });
}

function receiveMessages(id) {
  return new Promise((resolve)=>{
    connect(id).then((client)=>{
      resolve(client.receiveMessages());

      heartbeat.startHeartbeatInterval(id);
    });
  });
}

function sendToMessagingService(message) {
  return connect(message.from).then((client)=>{
    client.toMessagingService(message);
  });
}

module.exports = {
    connect,
    disconnect,
    broadcastMessage,
    broadcastToLocalWS,
    getClientList,
    sendToMessagingService,
    receiveMessages
};
