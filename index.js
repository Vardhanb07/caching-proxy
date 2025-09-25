#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import systeminformation from "systeminformation";
import axios from "axios";
import express from "express";
import url from "node:url";

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
    console.log(chalk.red("port not available, try another"));
    process.exit(1);
  }
  if (!checkURL(origin)) {
    console.log(chalk.red("url format is incorrect"));
  }
  const response = await axios.get(origin);
  app.get("/", (req, res) => {
    res.set(response.headers);
    res.send(response.data);
  });
  app.get("/:route", async (req, res) => {
    const response = await axios.get(url.resolve(origin, req.params.route));
    res.send(response.data);
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
        console.log(chalk.green(`localhost: http://localhost:${options.port}`))
      )
      .catch((e) => console.log(e));
  });

program.parse(process.argv);
