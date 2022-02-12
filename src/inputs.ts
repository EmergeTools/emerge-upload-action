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
  // Therefore, on a PR we need to explicitly get the head sha from the event json data.
  let sha;
  let baseSha;
  let branchName;
  const eventFile = fs.readFileSync(process.env.GITHUB_EVENT_PATH ?? '', {
    encoding: 'utf8',
  });
  const eventFileJson = JSON.parse(eventFile);
  if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
    sha = eventFileJson?.pull_request?.head?.sha ?? process.env.GITHUB_SHA ?? '';
    baseSha = eventFileJson?.pull_request?.base?.sha ?? '';
    branchName = process.env.GITHUB_HEAD_REF ?? '';
  } else if (process.env.GITHUB_EVENT_NAME === 'push') {
    sha = process.env.GITHUB_SHA ?? '';
    // Get the SHA of the previous commit, which will be the baseSha in the case of a push event.
    baseSha = eventFileJson?.before ?? '';

    const ref = process.env.GITHUB_REF ?? '';
    if (ref !== '') {
      const refSplits = ref.split('/');
      branchName = refSplits[refSplits.length - 1];
    }
  } else {
    core.setFailed(`Unsupported action trigger: ${process.env.GITHUB_EVENT_NAME}`);
  }

  if (sha === '') {
    core.setFailed('Could not get SHA of the head branch.');
  }
  if (baseSha === '') {
    core.setFailed('Could not get SHA of the base branch.');
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
    baseSha,
    repoName,
    prNumber,
    buildType,
    branchName,
  };
}

export default getInputs;
