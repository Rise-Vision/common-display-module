var os = require("os"),
  crypto = require("crypto"),
  totalMem = os.totalmem(),
  interfaces = os.networkInterfaces(),
  macs = [],
  cpus;

cpus = os.cpus().map((cpu)=>{
  return cpu.model;
}).sort().join();

Object.keys(interfaces).forEach((interface)=>{
  interfaces[interface].forEach((addr)=>{
    macs.push(addr.mac);
  });
});

macs.sort().join();

module.exports = function() {
  try {
    return crypto.createHash("md5").update(macs + cpus + totalMem).digest("hex");
  } catch(e) {
    return Math.random() + "";
  }
};
