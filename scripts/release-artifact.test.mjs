import test from 'node:test';
import assert from 'node:assert/strict';
import { selectReleaseArtifact, assertSameReleaseArtifact, selectPullRequestVerification } from './release-artifact.mjs';
import fs from 'node:fs';

const deploySource = fs.readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
  .split('- name: Deploy to GitHub Pages')[1].split(/script: \|\r?\n/)[1].replace(/^ {12}/gm, '');
const deployPages = new (Object.getPrototypeOf(async function() {}).constructor)('github', 'core', 'context', 'process', 'setTimeout', deploySource);
function deploymentFixture() {
  const artifact = { id: 44, name: 'github-pages', expired: false, size_in_bytes: 1024, digest: `sha256:${'d'.repeat(64)}`, workflow_run: { id: 55 } };
  const context = { repo: { owner: 'example', repo: 'site' }, runId: 55 };
  const env = { CANDIDATE: 'a'.repeat(40), PAGES_ARTIFACT_ID: '44', PAGES_ARTIFACT_DIGEST: 'd'.repeat(64) };
  const calls = [], outputs = {}, statuses = ['queued', 'succeed'];
  let tokenCalls = 0, misses = 0;
  const github = {
    rest: { actions: { getArtifact: async args => {
      calls.push({ kind: 'artifact', args });
      if (misses-- > 0) throw Object.assign(new Error('Not visible yet'), { status: 404 });
      return { data: artifact };
    } } },
    request: async (route, args) => {
      calls.push({ route, args });
      if (route.endsWith('/cancel')) return { data: {} };
      if (route.startsWith('POST ')) return { data: { id: 'deployment-1', page_url: 'https://example.github.io/site/' } };
      return { data: { status: statuses.shift() || 'queued' } };
    }
  };
  const core = { getIDToken: async () => { tokenCalls++; return 'test-oidc'; }, info() {}, setOutput: (key, value) => { outputs[key] = value; } };
  return { artifact, env, calls, outputs, statuses, get tokenCalls() { return tokenCalls; }, missOnce() { misses = 1; }, run: () => deployPages(github, core, context, { env }, callback => callback()) };
}

test('Pages deploys the uploaded immutable artifact ID with the approved SHA and OIDC, without name discovery', async () => {
  const f = deploymentFixture();f.missOnce();await f.run();
  const created = f.calls.find(call => call.route?.startsWith('POST '));
  assert.equal(created.args.artifact_id, 44);assert.equal(created.args.pages_build_version, 'a'.repeat(40));assert.equal(created.args.oidc_token, 'test-oidc');
  assert.equal(f.calls.filter(call => call.kind === 'artifact').length, 2);
  assert.equal(f.outputs.page_url, 'https://example.github.io/site/');assert.equal(f.tokenCalls, 1);
  assert(!f.calls.some(call => call.route?.endsWith('/cancel')));
});
for (const [label, mutate] of [
  ['different ID', a => { a.id = 99; }], ['different name', a => { a.name = 'other'; }],
  ['expired', a => { a.expired = true; }], ['different run', a => { a.workflow_run.id = 99; }],
  ['different digest', a => { a.digest = `sha256:${'e'.repeat(64)}`; }], ['empty archive', a => { a.size_in_bytes = 0; }]
]) test(`Pages rejects ${label} before requesting OIDC or deployment`, async () => {
  const f = deploymentFixture();mutate(f.artifact);await assert.rejects(f.run(), /does not match/);assert.equal(f.tokenCalls, 0);assert(!f.calls.some(call => call.route));
});
test('Pages rejects malformed upload identity before API calls', async () => {
  const f = deploymentFixture();f.env.PAGES_ARTIFACT_ID = '';await assert.rejects(f.run(), /Invalid uploaded/);assert.equal(f.calls.length, 0);
});
test('Pages cancels a deployment that fails or times out', async () => {
  for (const statuses of [['deployment_failed'], []]) {
    const f = deploymentFixture();f.statuses.splice(0, f.statuses.length, ...statuses);
    await assert.rejects(f.run(), /deployment failed|timed out/);assert(f.calls.at(-1).route.endsWith('/cancel'));assert.deepEqual(f.outputs, {});
  }
});

const sha = 'a'.repeat(40);
const options = { owner: 'example', repo: 'site', sha, now: Date.parse('2026-10-24T00:00:00Z') };

function fixture() {
  const workflow = { id: 10, path: '.github/workflows/quality-gate.yml', state: 'active' };
  const run = {
    id: 20, workflow_id: 10, path: workflow.path, run_attempt: 2,
    repository: { id: 30, full_name: 'example/site' }, head_repository: { id: 30, full_name: 'example/site' },
    event: 'push', head_branch: 'main', head_sha: sha, status: 'completed', conclusion: 'success',
  };
  const artifact = {
    id: 40, name: `pages-candidate-${sha}-2`, expired: false, expires_at: '2026-11-24T00:00:00Z',
    size_in_bytes: 1024, digest: `sha256:${'b'.repeat(64)}`,
    workflow_run: { id: 20, repository_id: 30, head_repository_id: 30, head_branch: 'main', head_sha: sha },
  };
  const data = { workflow, run, artifact, runs: [run], artifacts: [artifact] };
  const calls = [];
  const github = {
    rest: { actions: {
      getWorkflow: async args => { calls.push(args); return { data: workflow }; },
      listWorkflowRuns: 'runs', listWorkflowRunArtifacts: 'artifacts',
    } },
    paginate: async (endpoint, args) => { calls.push(args); return data[endpoint]; },
  };
  return { ...data, data, github, calls };
}

test('selects a successful main push artifact using workflow, repository, SHA, and attempt', async () => {
  const f = fixture();
  const selected = await selectReleaseArtifact(f.github, options);
  assert.deepEqual(selected, { run_id: 20, run_attempt: 2, artifact_id: 40, digest: f.artifact.digest });
  assert.deepEqual(f.calls, [
    { owner: 'example', repo: 'site', workflow_id: 'quality-gate.yml' },
    { owner: 'example', repo: 'site', workflow_id: 10, branch: 'main', event: 'push', head_sha: sha, per_page: 100 },
    { owner: 'example', repo: 'site', run_id: 20, per_page: 100 },
  ]);
});

for (const [label, mutate, expected] of [
  ['no matching main run', f => { f.data.runs = []; }, /No main push/],
  ['a disabled workflow', f => { f.workflow.state = 'disabled_manually'; }, /workflow must be active/],
  ['another workflow', f => { f.run.workflow_id = 99; }, /different workflow/],
  ['another workflow path', f => { f.run.path = '.github/workflows/other.yml'; }, /different workflow/],
  ['another workflow ref', f => { f.run.path += '@refs/heads/feature'; }, /different workflow/],
  ['another repository', f => { f.run.repository.full_name = 'other/site'; }, /different repository/],
  ['a fork source', f => { f.run.head_repository.id = 99; }, /different repository/],
  ['a PR run', f => { f.run.event = 'pull_request'; }, /not a main push/],
  ['a manual CI run', f => { f.run.event = 'workflow_dispatch'; }, /not a main push/],
  ['another branch', f => { f.run.head_branch = 'feature'; }, /not a main push/],
  ['another SHA', f => { f.run.head_sha = 'c'.repeat(40); }, /not a main push/],
  ['an in-progress run', f => { f.run.status = 'in_progress'; }, /completed successfully/],
  ['a failed run', f => { f.run.conclusion = 'failure'; }, /completed successfully/],
  ['a cancelled run', f => { f.run.conclusion = 'cancelled'; }, /completed successfully/],
  ['an undefined conclusion', f => { f.run.conclusion = null; }, /completed successfully/],
  ['a missing attempt', f => { delete f.run.run_attempt; }, /run attempt/],
  ['a missing artifact during migration', f => { f.data.artifacts = []; }, /Merge the artifact-producing workflow/],
  ['duplicate artifacts', f => { f.data.artifacts.push({ ...f.artifact, id: 41 }); }, /missing or ambiguous/],
  ['an artifact from an earlier attempt', f => { f.artifact.name = `pages-candidate-${sha}-1`; }, /missing or ambiguous/],
  ['an expired artifact flag', f => { f.artifact.expired = true; }, /has expired/],
  ['an expired timestamp', f => { f.artifact.expires_at = '2026-10-23T00:00:00Z'; }, /has expired/],
  ['an invalid expiration', f => { f.artifact.expires_at = 'unknown'; }, /has expired/],
  ['an empty artifact', f => { f.artifact.size_in_bytes = 0; }, /invalid identity, size, or digest/],
  ['a missing digest', f => { delete f.artifact.digest; }, /invalid identity, size, or digest/],
  ['an unsupported digest', f => { f.artifact.digest = 'md5:123'; }, /invalid identity, size, or digest/],
  ['an invalid artifact ID', f => { f.artifact.id = '40'; }, /invalid identity, size, or digest/],
  ['an artifact with no source', f => { delete f.artifact.workflow_run; }, /does not belong/],
  ['an artifact from another run', f => { f.artifact.workflow_run.id = 99; }, /does not belong/],
  ['an artifact from another repository', f => { f.artifact.workflow_run.repository_id = 99; }, /does not belong/],
  ['an artifact from a fork', f => { f.artifact.workflow_run.head_repository_id = 99; }, /does not belong/],
  ['an artifact from another SHA', f => { f.artifact.workflow_run.head_sha = 'c'.repeat(40); }, /does not belong/],
  ['an artifact from another branch', f => { f.artifact.workflow_run.head_branch = 'feature'; }, /does not belong/],
]) {
  test(`rejects ${label}`, async () => {
    const f = fixture();
    mutate(f);
    await assert.rejects(selectReleaseArtifact(f.github, options), expected);
  });
}

test('does not fall back to an older success while a newer run is pending or failed', async () => {
  for (const status of ['queued', 'in_progress', 'completed']) {
    const f = fixture();
    f.data.runs.unshift({ ...f.run, id: 21, status, conclusion: status === 'completed' ? 'failure' : null });
    await assert.rejects(selectReleaseArtifact(f.github, options), /completed successfully/);
  }
});

test('accepts documented workflow paths with an explicit main ref', async () => {
  for (const ref of ['main', 'refs/heads/main']) {
    const f = fixture();
    f.run.path += `@${ref}`;
    assert.equal((await selectReleaseArtifact(f.github, options)).artifact_id, 40);
  }
});

test('rejects abbreviated, uppercase, and shell-like SHA input before making API calls', async () => {
  for (const invalid of ['main', 'a'.repeat(7), 'A'.repeat(40), `${sha}; echo bad`]) {
    const f = fixture();
    await assert.rejects(selectReleaseArtifact(f.github, { ...options, sha: invalid }), /full lowercase SHA/);
    assert.equal(f.calls.length, 0);
  }
});

test('accepts Actions string outputs and rejects a rerun or artifact change before deployment', () => {
  const selected = { run_id: '20', run_attempt: '2', artifact_id: '40', digest: `sha256:${'b'.repeat(64)}` };
  const current = { ...selected, run_id: 20, run_attempt: 2, artifact_id: 40 };
  assert.doesNotThrow(() => assertSameReleaseArtifact(selected, current));
  for (const key of Object.keys(selected)) {
    assert.throws(() => assertSameReleaseArtifact(selected, { ...current, [key]: 'changed' }), /changed before deployment/);
  }
});

test('API failures propagate instead of permitting deployment', async () => {
  const f = fixture();
  f.github.paginate = async () => { throw new Error('API unavailable'); };
  await assert.rejects(selectReleaseArtifact(f.github, options), /API unavailable/);
});

function prFixture() {
  const f = fixture();
  Object.assign(f.run, { event: 'pull_request', head_branch: 'feature' });
  f.artifact.name = `verified-source-${sha}-2`;
  f.artifact.workflow_run.head_branch = 'feature';
  return f;
}
test('selects a pinned same-repository PR receipt for independent content verification', async () => {
  const f = prFixture();
  assert.equal((await selectPullRequestVerification(f.github, { ...options, head: sha })).artifact_id, 40);
});
for (const [label, mutate] of [
  ['fork', f => { f.run.head_repository.id = 99; }],
  ['wrong workflow', f => { f.run.workflow_id = 99; }],
  ['wrong workflow path', f => { f.run.path = '.github/workflows/other.yml'; }],
  ['failed latest run', f => { f.run.conclusion = 'failure'; }],
  ['pending latest run', f => { f.run.status = 'in_progress'; }],
  ['different head', f => { f.run.head_sha = 'e'.repeat(40); }],
  ['main push', f => { f.run.event = 'push'; }],
  ['expired receipt', f => { f.artifact.expired = true; }],
  ['missing receipt', f => { f.data.artifacts = []; }],
  ['duplicate receipt', f => { f.data.artifacts.push({ ...f.artifact, id: 41 }); }],
  ['old attempt', f => { f.artifact.name = `verified-source-${sha}-1`; }],
  ['invalid digest', f => { f.artifact.digest = 'md5:bad'; }],
  ['different source run', f => { f.artifact.workflow_run.id = 99; }],
  ['different source head', f => { f.artifact.workflow_run.head_sha = 'e'.repeat(40); }],
  ['different source repository', f => { f.artifact.workflow_run.repository_id = 99; }],
]) test(`PR receipt selection rejects ${label}`, async () => {
  const f = prFixture(); mutate(f);
  await assert.rejects(selectPullRequestVerification(f.github, { ...options, head: sha }));
});
