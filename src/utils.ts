import * as path from 'path';
import { Nullable } from './types';

export function getPRNumber(refName: string): Nullable<string> {
  if (refName === '') {
    return undefined;
  }

  if (!refName.includes('pull')) {
    return undefined;
  }

  const splits = refName.split('/');
  return splits[2];
}

export function getAbsoluteArtifactPath(artifactPath: string): string {
  let cleanedArtifactPath = artifactPath;
  if (cleanedArtifactPath.startsWith('.')) {
    cleanedArtifactPath = cleanedArtifactPath.substr(1);
  }

  return path.join(
    process.env.GITHUB_WORKSPACE ?? '',
    cleanedArtifactPath,
  );
}
