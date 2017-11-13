const config = require("./common");

function validateMessage(message) {
  let error = "";

  if(!message){
    error = "Message is required";
  } else if(!message.from) {
    error = "From is required";
  } else if(!message.topic) {
    error = "Message topic is required";
  } else if(!message.data) {
    error = "BQ data is required";
  } else if(!message.data.projectName) {
    error = "BQ project name is required";
  } else if(!message.data.datasetName) {
    error = "BQ dataset name is required";
  } else if(!message.data.failedEntryFile) {
    error = "BQ failed entry file is required";
  } else if(!message.data.table) {
    error = "BQ table is required";
  } else if(!message.data.data) {
    error = message.data.data + " BQ details is required";
  }

  return error;
}

module.exports = (projectName, dataSetName, failedEntryFile)=>{

  return {
    /**
     * Configures message for broadcasting via LM to Logger module
     * @param {string} table
     * @param {object} detail
     * @param {string} from
     */
    log (from, table, detail) {
      let message = {
        "from": from,
        "topic": "log",
        "data": {
          "projectName": projectName,
          "datasetName": dataSetName,
          "failedEntryFile": failedEntryFile,
          "table": table,
          "data": detail
        }
      }

      let messageError = validateMessage(message);
      if(!messageError) {
        // using LM, in common.js
        config.broadcastMessage(message);
      } else {
        log.error(messageError);
        return;
      }
    }
  }
};
