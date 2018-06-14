const assert = require("assert");
const simpleMock = require("simple-mock");
const HttpProxyAgent = require("proxy-agent");
const HttpsProxyAgent = require("https-proxy-agent");
const {join: pathJoin} = require("path");
const mock = simpleMock.mock;
const mockfs = require("mock-fs");
const platform = require("rise-common-electron").platform;
const common = require("../../common.js");

describe("Config", ()=>{
  afterEach(()=>{
    simpleMock.restore();
    mockfs.restore();

    common.clear();
  });

  it("gets display settings synchronously", ()=>{
    mock(platform, "readTextFileSync").returnWith("something");
    assert(common.getDisplaySettingsSync().tempdisplayid);
  });

  it("gets module path", ()=>{
    mock(common, "getInstallDir").returnWith("rvplayer");
    assert.equal(common.getModuleDir(), pathJoin("rvplayer", "modules"));
  });

  it("gets script dir", ()=>{
    mock(common, "getInstallDir").returnWith("rvplayer");
    assert.equal(common.getScriptDir(), pathJoin("rvplayer", "scripts"));
  });

  it("gets display settings synchronously", ()=>{
    mock(platform, "readTextFileSync").returnWith("something");
    assert(common.getDisplaySettingsSync().tempdisplayid);
  });

  it("does not generate a tempdisplayid if a display id is already set", ()=>{
    mock(platform, "readTextFileSync").returnWith("displayid=something");

    assert.equal(common.getDisplaySettingsSync().displayid, 'something');
    assert(!common.getDisplaySettingsSync().tempdisplayid);
  });

  it("reads display settings from cache on second synchronous call", ()=>{
    mock(platform, "readTextFileSync").returnWith("displayid=something");

    assert.equal(common.getDisplaySettingsSync().displayid, 'something');
    assert.equal(platform.readTextFileSync.callCount, 1);

    assert.equal(common.getDisplaySettingsSync().displayid, 'something');
    // not read again
    assert.equal(platform.readTextFileSync.callCount, 1);
  });

  it("fails to get display settings asynchronously if text file cannot be read", ()=>{
    return common.getDisplaySettings()
    .then(assert.fail)
    .catch(assert.ok);
  });

  it("succeeds in getting display settings asynchronously if text file is read", ()=>{
    mock(platform, "readTextFile").resolveWith("text=test");
    return common.getDisplaySettings()
    .then((resp)=>{
      assert.equal(resp.text, "test");
    })
  });

  it("reads display settings from cache on second asynchronous call", ()=>{
    mock(platform, "readTextFile").resolveWith("text=test");

    return common.getDisplaySettings()
    .then(settings => {
      assert.equal(settings.text, "test");
      assert.equal(platform.readTextFile.callCount, 1);

      return common.getDisplaySettings();
    })
    .then(settings => {
      assert.equal(settings.text, "test");

      // not read again
      assert.equal(platform.readTextFile.callCount, 1);
    })
  });

  it("gets an individual text file property", () => {
    mock(platform, "readTextFile").resolveWith("text=test");

    return common.getDisplayProperty("text")
    .then(value => assert.equal(value, "test"));
  });

  it("returns display settings file path", ()=>{
    var displaySettingsPath;
    mock(common, "getInstallDir").returnWith("root");
    displaySettingsPath = common.getDisplaySettingsPath();
    assert.equal(displaySettingsPath, "root/RiseDisplayNetworkII.ini");
  });

  it("returns proxy agents when HTTP_PROXY and HTTPS_PROXY are set", ()=>{
    mock(process.env, 'HTTP_PROXY', 'http://localhost:9191');
    mock(process.env, 'HTTPS_PROXY', 'http://localhost:9191');

    const agents = common.getProxyAgents();

    assert(agents);
    assert(agents.httpAgent);
    assert(agents.httpsAgent);
    assert(agents.httpAgent instanceof HttpProxyAgent)
    assert(agents.httpsAgent instanceof HttpsProxyAgent)
  });

  it("does not return proxy agents when HTTP_PROXY / HTTPS_PROXY are empty", ()=>{
    mock(process.env, 'HTTP_PROXY', '');
    mock(process.env, 'HTTPS_PROXY', '');

    const agents = common.getProxyAgents();

    assert(agents);
    assert(!agents.httpAgent);
    assert(!agents.httpsAgent);
  });

  it("does not return proxy agents when HTTP_PROXY / HTTPS_PROXY are not provided", ()=>{
    const agents = common.getProxyAgents();

    assert(agents);
    assert(!agents.httpAgent);
    assert(!agents.httpsAgent);
  });

  it("should provide display id when display id is read from file", () => {
    mock(platform, "readTextFile").resolveWith("displayid=abc123");
    return common.getDisplayId()
      .then((displayId)=>{
        assert.equal(displayId, "abc123");
      })
      .catch(assert.fail);
  });

  it("should provide display id from a temp created one", () => {
    mock(platform, "readTextFile").resolveWith("text=test");
    return common.getDisplayId()
      .then((displayId)=>{
        assert(displayId);
      })
      .catch(assert.fail);
  });

  it("should provide latest version in manifest", () => {
    const mockLocalManifest = {
      "player-electron":{"version":"2017.11.20.15.52"},
      "launcher":{"version":"2017.11.20.23.14"},
      "local-messaging":{"version":"2017.11.17.22.12"},
      "local-storage":{"version":"test"},
      "logging": {}
    };
    mock(common, "getManifest").returnWith(mockLocalManifest);

    assert.equal(common.getLatestVersionInManifest(), "2017.11.20.23.14");
  });

  it("should return true if BETA file exists", ()=>{
    mock(common, "getModuleVersion").returnWith("test");

    mockfs({
      [`${platform.getHomeDir()}/rvplayer/modules/launcher/test/Installer/`]: {
        "BETA": ""
      }});

      assert(common.isBetaLauncher());
  });

  it("should return false if BETA file does not exist", ()=>{
    mock(common, "getModuleVersion").returnWith("test");

    mockfs({
      [`${platform.getHomeDir()}rvplayer/modules/launcher/test/Installer/`]: {}});

      assert(!common.isBetaLauncher());
  });

});
