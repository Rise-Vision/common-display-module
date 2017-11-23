const assert = require("assert"),
simpleMock = require("simple-mock"),
HttpProxyAgent = require("proxy-agent"),
HttpsProxyAgent = require("https-proxy-agent"),
{join: pathJoin} = require("path"),
mock = simpleMock.mock,
platform = require("rise-common-electron").platform,
common = require("../../common.js");

describe("Config", ()=>{
  afterEach(()=>{
    simpleMock.restore();
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
    .catch(assert.fail);
  });

  it("returns display settings file path", ()=>{
    var displaySettingsPath;
    mock(common, "getInstallDir").returnWith("root");
    displaySettingsPath = common.getDisplaySettingsPath();
    assert.equal(displaySettingsPath, "root/RiseDisplayNetworkII.ini");
  });

  it("returns proxy agent when HTTP_PROXY and HTTPS_PROXY are set", ()=>{
    mock(process.env, 'HTTP_PROXY', 'http://localhost:9191');
    mock(process.env, 'HTTPS_PROXY', 'http://localhost:9191');

    const agents = common.getProxyAgents();

    assert(agents);
    assert(agents.httpAgent);
    assert(agents.httpsAgent);
    assert(agents.httpAgent instanceof HttpProxyAgent)
    assert(agents.httpsAgent instanceof HttpsProxyAgent)
  });

  it("does not return proxy agent when HTTPS_PROXY is empty", ()=>{
    mock(process.env, 'HTTP_PROXY', '');
    mock(process.env, 'HTTPS_PROXY', '');

    const agents = common.getProxyAgents();

    assert(agents);
    assert(!agents.httpAgent);
    assert(!agents.httpsAgent);
  });

  it("does not return proxy agent when HTTPS_PROXY is not provided", ()=>{
    const agents = common.getProxyAgents();

    assert(agents);
    assert(!agents.httpAgent);
    assert(!agents.httpsAgent);
  });

});
