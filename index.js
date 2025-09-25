#!/usr/bin/env node

const { program } = require("commander");
const systeminformation = require("systeminformation");
const axios = require("axios");
const express = require("express");
const url = require("node:url");
const { get, set, check } = require("./cache");
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

async function startApp(port, origin, app) {
  const isPortAvailable = await canPortbeUsed(port);
  if (!isPortAvailable) {
    console.log(pc.red("port not available, try another"));
    process.exit(1);
  }
  if (!checkURL(origin)) {
    console.log(pc.red("url format is incorrect"));
    process.exit(1);
  }
  const response = await axios.get(origin);
  app.get("/", (req, res) => {
    res.set(response.headers);
    res.send(response.data);
  });
  app.get("/:route", async (req, res) => {
    const uri = url.resolve(origin, req.params.route);
    if (!check(uri)) {
      const response = await axios.get(url.resolve(origin, req.params.route));
      res.set({ "X-Cache": "MISS" });
      set(uri, response.data);
      res.send(response.data);
    } else {
      res.set({ "X-Cache": "HIT" });
      res.send(get(uri));
    }
  });
  app.listen(port);
}

program.version("1.0.0").description("caching-proxy");
program
  .option("-p, --port <number>", "Add port")
  .option("-o, --origin <string>", "Add url")
  .action((options) => {
    startApp(options.port, options.origin, app)
      .then(() =>
        console.log(pc.green(`localhost: http://localhost:${options.port}`))
      )
      .catch((e) => console.log(e));
  });

program.parse(process.argv);
