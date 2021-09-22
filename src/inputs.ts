import * as fs from 'fs';
import * as process from 'process';
import { UploadInputs } from './types';
import { getPRNumber, getAbsoluteArtifactPath } from './utils';

const core = require('@actions/core');
const github = require('@actions/github');

function getInputs(): UploadInputs {
  core.info('Parsing inputs...');

  const artifactPath = core.getInput('artifact_path', { required: true });
  if (artifactPath === '') {
    core.setFailed('No artifact_path argument provided.');
  }

  const emergeApiKey = core.getInput('emerge_api_key', { required: true });
  if (emergeApiKey === '') {
    core.setFailed('No emerge_api_key input provided.');
  }

  // On PRs, the GITHUB_SHA refers to the merge commit instead
  // of the commit that triggered this action.
  // Therefore, on a PR we need to explicitly get the head sha
  let sha;
  let branchName;
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    const eventFile = fs.readFileSync(process.env.GITHUB_EVENT_PATH ?? '', {
      encoding: 'utf8',
    });
    const eventFileJson = JSON.parse(eventFile);
    sha = eventFileJson?.pull_request?.head?.sha ?? process.env.GITHUB_SHA ?? '';
    branchName = process.env.GITHUB_HEAD_REF ?? '';
  } else {
    sha = process.env.GITHUB_SHA ?? '';
    const ref = process.env.GITHUB_REF ?? '';
    if (ref !== '') {
      const refSplits = ref.split('/');
      branchName = refSplits[refSplits.length - 1];
    }
  }

  if (sha === '') {
    core.setFailed('Could not get SHA of the head branch.');
  }
  // branchName is optional, so we won't fail if not present
  if (branchName === '') {
    // Explicitly set to undefined so we won't send an empty string to the Emerge API
    branchName = undefined;
  }

  const repoName = `${github.context.repo.owner}/${github.context.repo.repo}`;
  if (repoName === '') {
    core.setFailed('Could not get repository name.');
  }

  // Required for PRs
  const refName = process.env.GITHUB_REF ?? '';
  const prNumber = getPRNumber(refName);
  if (refName.includes('pull') && !prNumber) {
    core.setFailed('Could not get prNumber for a PR triggered build.');
  }

  // Optional args
  let buildType = core.getInput('build_type');
  if (buildType === '') {
    // Explicitly set to undefined so we won't send an empty string to the Emerge API
    buildType = undefined;
  }

  // Pre-processing the filename
  const pathSplits = artifactPath.split('/');
  const filename = pathSplits[pathSplits.length - 1];
  const absoluteArtifactPath = getAbsoluteArtifactPath(artifactPath);

  return {
    artifactPath: absoluteArtifactPath,
    filename,
    emergeApiKey,
    sha,
    repoName,
    prNumber,
    buildType,
    branchName,
  };
}

export default getInputs;
