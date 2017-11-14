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
    error = "BQ details is required";
  } else if(!message.data.data.event) {
    error = "BQ event is required";
  }

  return error;
}

module.exports = (projectName, dataSetName, failedEntryFile)=>{

  return {
    /**
     * Configures message for broadcasting via LM to Logger module
     * @param {string} evt - event required for BQ logging
     * @param {object} detail - module specific BQ data to log
     * @param {string} table - the BQ table to log to
     * @param {string} from - from what module
     */
    log (evt, detail, table, from) {
      let message = {
        "topic": "log",
        "from": from,
        "data": {
          "projectName": projectName,
          "datasetName": dataSetName,
          "failedEntryFile": failedEntryFile,
          "table": table,
          "data": Object.assign({"event": evt}, detail)
        },
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
