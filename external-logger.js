const messaging = require("./messaging");

let displaySettings = {};

/**
 * Validates LM message against BQ entry standards
 * @param {object} message - event required for BQ logging
 * @param {object} detail - module specific BQ data to log
 * @return {string} - error message, empty if no error
 */
function validateMessage(message, detail) {
  let error = "";

  if(!message){
    error = "Message is required";
  } else if(!message.from) {
    error = "From is required";
  } else if(!message.data.projectName) {
    error = "BQ project name is required";
  } else if(!message.data.datasetName) {
    error = "BQ dataset name is required";
  } else if(!message.data.failedEntryFile) {
    error = "BQ failed entry file is required";
  } else if(!message.data.table) {
    error = "BQ table is required";
  } else if(!message.data.data.event) {
    error = "BQ event is required";
  } else if(!detail || typeof detail === "string" || !Object.keys(detail).length){
    /* Checks detail separately since its value combined
    with another object that specifies the event */
    error = "BQ detail is required";
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
      const displayId = displaySettings.displayid || displaySettings.tempdisplayid || detail.display_id;

      if (!displayId) {
        throw new Error("Display ID not provided");
      }

      const data = Object.assign({}, {"event": evt, "display_id": displayId}, detail);

      const message = {
        "topic": "log",
        "from": from,
        "data": {
          "projectName": projectName,
          "datasetName": dataSetName,
          "failedEntryFile": failedEntryFile,
          "table": table,
          "data": data
        },
      };

      let messageError = validateMessage(message, detail);
      if(!messageError) {
        // using LM, in common.js
         messaging.broadcastMessage(message);
      } else {
        console.log(`external-logger error - ${from || "source module undefined"}: ${messageError}`);
        return;
      }
    },
    setDisplaySettings(settings) {
      displaySettings = settings;
    }
  }
};
