import fetch, { Headers } from 'node-fetch';
import * as fs from 'fs';
import getInputs from './inputs';

const core = require('@actions/core');

async function run(): Promise<void> {
  const inputs = getInputs();

  const requestBody = {
    filename: inputs.filename,
    prNumber: inputs.prNumber,
    branch: inputs.branchName,
    sha: inputs.sha,
    baseSha: inputs.baseSha,
    repoName: inputs.repoName,
    buildType: inputs.buildType,
  };

  core.debug(`requestBody: ${JSON.stringify(requestBody)}`);
  const response = await fetch('https://api.emergetools.com/upload', {
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-type': 'application/json',
      'X-API-Token': inputs.emergeApiKey,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  const { uploadURL } = data;
  if (!uploadURL || uploadURL === '') {
    core.setFailed('No uploadURL found in upload response.');
  }

  const file = fs.readFileSync(inputs.artifactPath);

  const headers = new Headers({ 'Content-Type': 'application/zip' });
  core.info(`Uploading artifact at path ${inputs.artifactPath}...`);
  await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers,
  });
}

run().catch((e) => {
  core.setFailed(`Error uploading artifact to Emerge: ${e.message}`);
});
