const config = require("./common");

module.exports = (projectName, dataSetName, failedEntryFile)=>{
  var mod = {
    /**
     * Configures message for broadcasting via LM to Logger module
     * @param {string} table
     * @param {object} detail
     */
    log (table, detail) {
      var message = {
        "topic": "log",
        "data": {
          "projectName": projectName,
          "datasetName": dataSetName,
          "failedEntryFile": failedEntryFile,
          "table": table,
          "data": detail,
        }
      }
      // using LM, in common.js
      config.broadcastMessage(message);
    }
  }
  return mod;
};
