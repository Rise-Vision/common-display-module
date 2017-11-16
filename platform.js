const childProcess = require("child_process")

// Functions being ported from rise-common-electron to avoid dependencies upon that other project.
// More functions may be ported later.
module.exports = {
  getOS() {
    return process.platform;
  },
  isWindows() {
    return module.exports.getOS() === "win32";
  },
  getFreeDiskSpace(dir=__dirname) {
    return new Promise((resolve, reject)=>{
      if(module.exports.isWindows()) {
        var winCommand = "wmic LogicalDisk Where \"Name='DRIVE:'\" GET FreeSpace".replace("DRIVE", dir.substr(0, 1));

        childProcess.exec(winCommand, (err, stdout)=>{
          if(err) { reject(err); }

          resolve(Number(stdout.split("\n")[1]));
        });
      }
      else {
        var lnxCommand = "df -k " + dir + " | awk 'NR==2 {print $4}'";

        childProcess.exec(lnxCommand, (err, stdout)=>{
          if(err) { reject(err); }

          resolve(Number(stdout) * 1024);
        });
      }
    });
  },
}
