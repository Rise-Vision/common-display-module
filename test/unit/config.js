const assert = require("assert"),
simpleMock = require("simple-mock"),
mock = simpleMock.mock,
platform = require("rise-common-electron").platform,
config = require("../../config.js");

describe("Config", ()=>{
  afterEach(()=>{
    simpleMock.restore();
  });

  it("gets display settings synchronously", ()=>{
    mock(platform, "readTextFileSync").returnWith("something");
    assert(config.getDisplaySettingsSync().tempdisplayid);
  });

  it("fails to get display settings asynchronously if text file cannot be read", ()=>{
    return config.getDisplaySettings()
    .then(assert.fail)
    .catch(assert.ok);
  });
  it("succeeds in getting display settings asynchronously if text file is read", ()=>{
    mock(platform, "readTextFile").resolveWith("text=test");
    return config.getDisplaySettings()
    .then((resp)=>{
      assert.equal(resp.text, "test");
    })
    .catch(assert.fail);
  });

  it("returns display settings file path", ()=>{
    var displaySettingsPath;
    mock(config, "getInstallDir").returnWith("root");
    displaySettingsPath = config.getDisplaySettingsPath();
    assert.equal(displaySettingsPath, "root/RiseDisplayNetworkII.ini");
  });

});
