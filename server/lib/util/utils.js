const crypto = require("crypto");
const fs = require("fs");

function wait(millis) {
  const waitTill = new Date(new Date().getTime() + millis);
  while (waitTill > new Date());
}

function getFile(path) {
  return fs.readFileSync(path);
}

function getgraphId() {
  return crypto
    .randomBytes(8)
    .toString("hex")
    .toUpperCase();
}
function putFile(path, data, isJson) {
  if (isJson) {
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
  } else {
    fs.writeFileSync(path, data);
  }
}

function FileExists(path) {
  return fs.existsSync(path);
}

module.exports = {
  wait: wait,
  getFile: getFile,
  getgraphId: getgraphId,
  putFile: putFile,
  isFile: FileExists
};
