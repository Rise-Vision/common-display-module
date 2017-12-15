const fs = require("fs");
const path = require("path");
const nodeExe = path.basename(process.execPath);
const scriptName = path.basename(__filename);
const filePath = process.argv[2];
const moduleName = process.argv[3];
const version = process.argv[4];
const pct = process.argv[5] ? Number(process.argv[5]) : null;
const type = process.argv[6] ? process.argv[6] : "module";

if (!filePath || !filePath.endsWith(".json")) {return err();}
if (!version || !version.startsWith("2")) {return err();}
if (!moduleName) {return err();}

try {
  let json = JSON.parse(fs.readFileSync(filePath));
  if(type === "module") {
    json.modules = json.modules.map(module=>module.name === moduleName ? Object.assign({}, module, {version, url: updateUrl(module.url, version)}) : module);
  } else if(type === "component") {
    json.components = json.components.map(component=>component.name === moduleName ? Object.assign({}, component, {version}) : component);
  }

  json.rolloutPct = (pct || pct === 0) ? pct : json.rolloutPct;
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
} catch(e) {
  return err(e);
}

function updateUrl(url, version) {
  let parts = url.split("/");

  if (parts[parts.length - 2] && parts[parts.length - 2].startsWith("20")) {
    parts[parts.length - 2] = version;
  }

  return parts.join("/");
}

function err(e) {
  console.error(`usage: ${nodeExe} ${scriptName} [path-to${path.sep}manifest-file.json] [moduleName] [version] [pct]`);
  if (e) console.error(e);
}
