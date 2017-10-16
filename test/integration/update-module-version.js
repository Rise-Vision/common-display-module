const assert = require("assert");
const fs = require("fs");
const {join: pathJoin} = require("path");
const platform = require("rise-common-electron").platform;
const config = require("../../common.js");
const execFile = require("child_process").execFile;

describe("UpdateModuleVersion", ()=>{

  const filePath = pathJoin(__dirname, "../../update-module-version.js");

  describe("when not all params are present", ()=> {
    beforeEach(()=>{
      platform.writeTextFileSync(config.getManifestPath(), `{"rolloutPct": 10, "modules": [{"name": "test","version": "2017.10.12.04.45"}]}`);
    });
    afterEach(()=>{
      fs.unlinkSync(config.getManifestPath());
    });

    it("does not update manifest if module name empty", (done) => {
      execFile("node", [filePath, config.getManifestPath(), "", "2017.10.13.21.21", 25], () => {
        assert.deepEqual(config.getManifest(), {rolloutPct: 10, modules: [{name: "test",version: "2017.10.12.04.45"}]});
        done();
      });
    });

    it("does not update manifest if version is empty", (done) => {
      execFile("node", [filePath, config.getManifestPath(), "test", "", 25], () => {
        assert.deepEqual(config.getManifest(), {rolloutPct: 10, modules: [{name: "test",version: "2017.10.12.04.45"}]});
        done();
      });
    });

    it("updates manifest when pct is not present", (done)=>{
      execFile("node", [filePath, config.getManifestPath(), "test", "2017.10.13.21.21"], (error) => {
        assert.deepEqual(config.getManifest(), {rolloutPct: 10, modules: [{name: "test",version: "2017.10.13.21.21"}]});
        done();
      });

    });
  });

  describe("when all params are present", ()=>{

    beforeEach(()=>{
      platform.writeTextFileSync(config.getManifestPath(), `{"rolloutPct": 10, "modules": [{"name": "test","version": "2017.10.12.04.45"}]}`);
    });
    afterEach(()=>{
      fs.unlinkSync(config.getManifestPath());
    });

    it("updates module manifeset", (done)=>{
      execFile("node", [filePath, config.getManifestPath(), "test", "2017.10.13.21.21", 25], (error) => {
        console.log(error);
        assert.deepEqual(config.getManifest(), {rolloutPct: 25, modules: [{name: "test",version: "2017.10.13.21.21"}]});
        done();
      });

    });

    it("does not update manifest if version doesn't start with 2", (done) => {
      execFile("node", [filePath, config.getManifestPath(), "test", "1.0.1", 25], () => {
        assert.deepEqual(config.getManifest(), {rolloutPct: 10, modules: [{name: "test",version: "2017.10.12.04.45"}]});
        done();
      });
    });

    it("does not update specific module version if module name doesn't match", (done) => {
      execFile("node", [filePath, config.getManifestPath(), "testabc", "2017.10.13.21.21", 25], () => {
        assert.deepEqual(config.getManifest(), {rolloutPct: 25, modules: [{name: "test",version: "2017.10.12.04.45"}]});
        done();
      });
    });
  });

});