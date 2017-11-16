const assert = require("assert")
const childProcess = require("child_process")
const path = require("path")
const platform = require("../../platform")
const simpleMock = require("simple-mock")

const mock = simpleMock.mock

var diskSpaceOutputWin =
`FreeSpace
265906098176     `;

var diskSpaceOutputLnx =
`70538216`;

describe("platform", ()=>{

  beforeEach("setup mocks", ()=>{
  });

  afterEach("clean mocks", ()=>{
    simpleMock.restore();
  });

  it("returns free disk space with dir as parameter on linux", ()=>{
    var installDir = "/home/rise/rvplayer";
    var dir = "/home/rise/rvplayer/test";

    mock(platform, "isWindows").returnWith(false);
    mock(platform, "getInstallDir").returnWith(installDir);
    mock(childProcess, "exec").callbackWith(null, diskSpaceOutputLnx);

    return platform.getFreeDiskSpace(dir)
    .then((space)=>{
      assert(childProcess.exec.called);
      assert.equal(childProcess.exec.lastCall.args[0], "df -k " + dir + " | awk 'NR==2 {print $4}'");
      assert.equal(space, 72231133184);
    });
  });

  it("returns free disk space on Linux", ()=>{
    mock(platform, "isWindows").returnWith(false);
    mock(childProcess, "exec").callbackWith(null, diskSpaceOutputLnx);

    return platform.getFreeDiskSpace()
      .then((space)=>{
      assert(childProcess.exec.called);
    assert.equal(childProcess.exec.lastCall.args[0], "df -k " + path.join(__dirname, "..", "..") + " | awk 'NR==2 {print $4}'");
    assert.equal(space, 72231133184);
    });
  });

  it("fails to return free disk space on Linux", ()=>{
    var installDir = "/home/rise/rvplayer";

    mock(platform, "isWindows").returnWith(false);
    mock(platform, "getInstallDir").returnWith(installDir);
    mock(childProcess, "exec").callbackWith("error");

    return platform.getFreeDiskSpace()
    .catch((err)=>{
      assert.equal(err, "error");
    });
  });

  it("returns free disk space on Windows", ()=>{
    mock(platform, "isWindows").returnWith(true);
    mock(childProcess, "exec").callbackWith(null, diskSpaceOutputWin);

    return platform.getFreeDiskSpace()
    .then((space)=>{
      assert(childProcess.exec.called);
      assert.equal(childProcess.exec.lastCall.args[0], `wmic LogicalDisk Where "Name='${__dirname.substr(0,1)}:'" GET FreeSpace`);
      assert.equal(space, 265906098176);
    });
  });

  it("fails to return free disk space on Windows", ()=>{
    var installDir = "C:\\Users\\rise\\AppData\\Local\\rvplayer";

    mock(platform, "isWindows").returnWith(true);
    mock(platform, "getInstallDir").returnWith(installDir);
    mock(childProcess, "exec").callbackWith("error");

    return platform.getFreeDiskSpace()
      .catch((err)=>{
        assert.equal(err, "error");
      });
  });

});
