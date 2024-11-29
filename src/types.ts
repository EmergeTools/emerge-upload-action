export type Nullable<T> = T | undefined | null;

export type UploadInputs = {
  artifactPath: string
  filename: string
  emergeApiKey: string
  sha: string
  baseSha: string
  repoName: string

  // Required for PRs
  prNumber: Nullable<string>

  // Optional args
  buildType: Nullable<string>
  branchName: Nullable<string>
  appIdSuffix: Nullable<string>
};
