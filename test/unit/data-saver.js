const assert = require("assert");
const simpleMock = require("simple-mock");
const mock = simpleMock.mock;
const platform = require("rise-common-electron").platform;
const common = require("../../common.js");

describe("Data Save - Unit", ()=>{
  const dataSaverRewire = require("rewire")('../../data-saver');
  const testData = {
    "cacheDirectory": "/data-save/",
    "moduleName": "test-module",
    "componentId": "test-component-id",
    "hashedComponentId": dataSaverRewire.__get__("getHashedFileName")("test-component-id"),
    "nonexistingComponentId": "fake-id",
    "fileData" : {test : "testing"}
  }
  const dataSaver = require('../../data-saver')(testData.moduleName);

  beforeEach(()=>{
    mock(platform, 'writeTextFile');
    mock(platform, 'readTextFile');
    mock(platform, 'deleteRecursively');
  });

  afterEach(()=>{
    simpleMock.restore();
  });

  after(()=>{
    platform.deleteRecursively(dataSaverRewire.__get__("getPathToCacheDir")(testData.moduleName));
  });

  it("should create an instance of data-save", ()=>{
    dataSaver.init();

    assert(dataSaver.hasOwnProperty("putFile"));
    assert(dataSaver.hasOwnProperty("removeFile"));
    assert(dataSaver.hasOwnProperty("getFile"));
  });

  it("should save a file with given data", ()=>{
    return dataSaver.putFile(testData.componentId, JSON.stringify(testData.fileData))
    .then(()=>{
      assert(platform.writeTextFile.called);
      assert(platform.writeTextFile.lastCall.args[0].endsWith(testData.moduleName + testData.cacheDirectory + testData.hashedComponentId));
    });
  });

  it("should not save a file if given invalid componentId", ()=>{
    return dataSaver.putFile("", JSON.stringify(testData.fileData))
    .catch((error)=>{
      assert.equal(error.message, "data-save - missing componentId param");
    });
  });

  it("should get the file's data", ()=>{
    return dataSaver.getFile(testData.componentId)
    .then((data)=>{
      assert(platform.readTextFile.called);
      assert(platform.readTextFile.lastCall.args[0].endsWith(testData.moduleName + testData.cacheDirectory + testData.hashedComponentId));
      assert.equal(data, JSON.stringify(testData.fileData));
    });
  });

  it("should reject if no file to get data for componentId", ()=>{
    return dataSaver.getFile(testData.nonexistingComponentId)
    .catch((error)=>{
      assert(error.message.startsWith("data-save - GETFILE : file does not exist at"));
      assert(error.message.endsWith(testData.nonexistingComponentId));
    });
  });

  it("should remove the file", ()=>{
    return dataSaver.removeFile(testData.componentId)
    .then(()=>{
      assert(platform.deleteRecursively.called);
      assert(platform.deleteRecursively.lastCall.args[0].endsWith(testData.moduleName + testData.cacheDirectory + testData.hashedComponentId));
    });
  });

  it("should reject if no file to remove for componentId", ()=>{
    return dataSaver.removeFile(testData.nonexistingComponentId)
    .catch((error)=>{
      assert(error.message.startsWith("data-save - REMOVEFILE : file does not exist at"));
      assert(error.message.endsWith(testData.nonexistingComponentId));
    });
  });
});
