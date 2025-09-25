const fs = require("node:fs");
const path = require("node:path");

/*
  key: origin
  specs: 
    set(): sets the data in cache
    get(): gets the data form the cache
    check(): checks if the data is present by comparing the key
*/

const cacheData = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "cache.json"))
);

function get(origin) {
  return cacheData[origin];
}

function set(origin, data) {
  cacheData[origin] = data;
  fs.writeFile(
    path.resolve(__dirname, "cache.json"),
    JSON.stringify(cacheData),
    (err) => {
      if (err) {
        throw err;
      }
    }
  );
}

function check(origin) {
  return get(origin) !== undefined;
}

module.exports = { get, set, check };
