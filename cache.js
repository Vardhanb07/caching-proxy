const nodeCache = require("node-cache");

const cache = new nodeCache();

/*
  key: origin
  specs: 
    set(): sets the data in cache
    get(): gets the data form the cache
    check(): checks if the data is present by comparing the key
*/

function get(origin) {
  return cache.get(origin);
}

function set(origin, data) {
  cache.set(origin, data, 2592000);
}

function check(origin) {
  if (get(origin)) {
    return false;
  }
  return true;
}

module.exports = { get, set, check };
