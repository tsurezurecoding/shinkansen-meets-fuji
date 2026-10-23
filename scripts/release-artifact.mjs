// The Pages workflow runs this file from its trusted main definition, never from
// the candidate checkout. Missing historical/expired artifacts fail closed.
const workflowPath = '.github/workflows/quality-gate.yml';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export async function selectReleaseArtifact(github, { owner, repo, sha, now = Date.now() }) {
  requireCondition(/^[0-9a-f]{40}$/.test(sha), 'Approved commit must be a full lowercase SHA.');
  const repository = `${owner}/${repo}`;
  const { data: workflow } = await github.rest.actions.getWorkflow({ owner, repo, workflow_id: 'quality-gate.yml' });
  requireCondition(Number.isSafeInteger(workflow.id) && workflow.id > 0
    && workflow.path === workflowPath && workflow.state === 'active',
    'The quality-gate workflow must be active.');

  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    owner, repo, workflow_id: workflow.id, branch: 'main', event: 'push', head_sha: sha, per_page: 100,
  });
  // Never fall back to an older success when the latest run is pending/failed.
  const run = runs.sort((a, b) => b.id - a.id)[0];
  requireCondition(run, 'No main push quality-gate run exists for the approved SHA.');
  const trustedPaths = [workflowPath, `${workflowPath}@main`, `${workflowPath}@refs/heads/main`];
  requireCondition(run.workflow_id === workflow.id && trustedPaths.includes(run.path),
    'The CI run belongs to a different workflow.');
  requireCondition(Number.isSafeInteger(run.id) && run.id > 0
    && Number.isSafeInteger(run.repository?.id) && run.repository.id > 0
    && run.repository?.full_name === repository && run.head_repository?.full_name === repository
    && run.repository.id === run.head_repository.id, 'The CI run belongs to a different repository.');
  requireCondition(run.event === 'push' && run.head_branch === 'main' && run.head_sha === sha,
    'The CI run is not a main push for the approved SHA.');
  requireCondition(run.status === 'completed' && run.conclusion === 'success',
    'The latest main push quality-gate run must have completed successfully.');
  requireCondition(Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0, 'Missing CI run attempt.');

  const name = `pages-candidate-${sha}-${run.run_attempt}`;
  const artifacts = await github.paginate(github.rest.actions.listWorkflowRunArtifacts, {
    owner, repo, run_id: run.id, per_page: 100,
  });
  const matches = artifacts.filter(artifact => artifact.name === name);
  requireCondition(matches.length === 1,
    'Verified Pages artifact is missing or ambiguous. Merge the artifact-producing workflow first; '
    + 'for an expired artifact, rerun the original main push quality-gate. Pages never rebuilds a candidate.');
  const artifact = matches[0];
  requireCondition(artifact.expired === false && Date.parse(artifact.expires_at) > now,
    'Verified Pages artifact has expired; rerun its main push quality-gate.');
  requireCondition(Number.isSafeInteger(artifact.id) && artifact.id > 0 && artifact.size_in_bytes > 0
    && /^sha256:[0-9a-f]{64}$/.test(artifact.digest), 'Verified Pages artifact has invalid identity, size, or digest.');
  const source = artifact.workflow_run;
  requireCondition(source?.id === run.id && source.repository_id === run.repository.id
    && source.head_repository_id === run.repository.id && source.head_branch === 'main' && source.head_sha === sha,
  'The artifact does not belong to the verified main CI run.');
  return { run_id: run.id, run_attempt: run.run_attempt, artifact_id: artifact.id, digest: artifact.digest };
}

export function assertSameReleaseArtifact(selected, current) {
  for (const key of ['run_id', 'run_attempt', 'artifact_id', 'digest']) {
    requireCondition(String(selected[key]) === String(current[key]),
      `Verified CI/artifact changed before deployment (${key}); start a new deployment.`);
  }
}
