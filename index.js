import { readFile } from "fs/promises";

import { ApifyClient } from "apify-client";
import core from "@actions/core";
import * as github from "@actions/github";

async function main() {
  let apifyClient;
  try {
    apifyClient = new ApifyClient({
      token: core.getInput("apify-token"),
    });
    const { username } = await apifyClient.user().get();
    core.info(`Successfully authenticated as ${username}`);
  } catch (err) {
    core.setFailed(`Apify client initialization failed: ${err.message}`);
    return;
  }

  let octokit;
  try {
    octokit = github.getOctokit(core.getInput("github-token"));
    const response = await octokit.request("GET /zen");
    core.info(response);
  } catch (err) {
    core.setFailed(`Octokit initialization failed: ${err.message}`);
    return;
  }

  const actorId = core.getInput("actor-id");
  const taskId = core.getInput("task-id");

  if (!!actorId == !!taskId) {
    core.setFailed("Exactly one of {actor-id, task-id} must be provided.");
    return;
  }

  const collectionClient = actorId
    ? apifyClient.actor(actorId)
    : apifyClient.task(taskId);

  const inputFile = core.getInput("input-file");
  let input;
  try {
    input = inputFile ? JSON.parse(await readFile(inputFile, "utf8")) : {};
  } catch (err) {
    core.setFailed(`Failed to load input file as JSON: ${err.message}`);
    return;
  }
  core.info(JSON.stringify(input));
}

main().catch((err) => {
  core.setFailed(`Uncaught exception: ${err.message}`);
});
