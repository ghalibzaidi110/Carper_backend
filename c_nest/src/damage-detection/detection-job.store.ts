/**
 * In-process job store for async damage detection.
 *
 * Scan requests return 202 + jobId immediately; background processing
 * runs without blocking the HTTP thread. Client polls GET /scan/:jobId
 * until status flips to "completed" or "failed".
 *
 * Jobs auto-expire after TTL_MS to prevent memory leaks. This is a
 * lightweight alternative to Bull/Redis — swap in when Redis is added.
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DetectionJob<T = unknown> {
  id: string;
  status: JobStatus;
  createdAt: number;
  result: T | null;
  error: string | null;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_JOBS = 200;

const jobs = new Map<string, DetectionJob>();

let _counter = 0;

export function createJob(): DetectionJob {
  // Evict expired jobs on every create to bound memory
  evictExpired();

  // Hard cap: if still over limit, drop oldest
  if (jobs.size >= MAX_JOBS) {
    const oldest = [...jobs.entries()].sort(
      (a, b) => a[1].createdAt - b[1].createdAt,
    )[0];
    if (oldest) jobs.delete(oldest[0]);
  }

  const id = `det_${Date.now()}_${++_counter}`;
  const job: DetectionJob = {
    id,
    status: 'pending',
    createdAt: Date.now(),
    result: null,
    error: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): DetectionJob | undefined {
  const job = jobs.get(id);
  if (job && Date.now() - job.createdAt > TTL_MS) {
    jobs.delete(id);
    return undefined;
  }
  return job;
}

export function updateJob(
  id: string,
  update: Partial<Pick<DetectionJob, 'status' | 'result' | 'error'>>,
): void {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, update);
}

function evictExpired(): void {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > TTL_MS) jobs.delete(id);
  }
}
