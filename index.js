#!/usr/bin/env node

const { program } = require("commander");
const systeminformation = require("systeminformation");
const axios = require("axios");
const express = require("express");
const url = require("node:url");
const { get, set, check, clear } = require("./cache");
const pc = require("picocolors");

const app = express();

/* 
regex for url: 
(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})
*/

async function canPortbeUsed(port) {
  const networkConnections = await systeminformation.networkConnections();
  return (
    networkConnections.find((networkConnection) => {
      if (
        !(networkConnection.localPort === String(port)) ||
        networkConnection.state === "LISTEN"
      ) {
        return undefined;
      }
    }) === undefined
  );
}

function checkURL(origin) {
  const regex = new RegExp(
    "(https?://(?:www.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|www.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9].[^s]{2,}|https?://(?:www.|(?!www))[a-zA-Z0-9]+.[^s]{2,}|www.[a-zA-Z0-9]+.[^s]{2,})"
  );
  return origin.match(regex);
}

async function startApp(options, app) {
  if (options.clearCache) {
    clear();
    console.log(pc.green("Cache cleared"));
    process.exit(0);
  }
  const isPortAvailable = await canPortbeUsed(options.port);
  if (!isPortAvailable) {
    console.log(pc.red("port not available, try another"));
    process.exit(1);
  }
  if (!checkURL(options.origin)) {
    console.log(pc.red("url format is incorrect"));
    process.exit(1);
  }
  const response = await axios.get(options.origin);
  app.get("/", (req, res) => {
    res.set(response.headers);
    res.send(response.data);
  });
  app.get("/:route", async (req, res) => {
    const uri = url.resolve(options.origin, req.params.route);
    if (!check(uri)) {
      const response = await axios.get(
        url.resolve(options.origin, req.params.route)
      );
      res.set({ "X-Cache": "MISS" });
      set(uri, response.data);
      res.send(response.data);
    } else {
      res.set({ "X-Cache": "HIT" });
      res.send(get(uri));
    }
  });
  app.listen(options.port);
}

program.version("1.0.0").description("caching-proxy");
program
  .option("-p, --port <number>", "Add port")
  .option("-o, --origin <string>", "Add url")
  .option("-c, --clear-cache", "Clear cache")
  .action((options) => {
    startApp(options, app)
      .then(() =>
        console.log(pc.green(`localhost: http://localhost:${options.port}`))
      )
      .catch((e) => console.error(e));
  });

program.parse(process.argv);
