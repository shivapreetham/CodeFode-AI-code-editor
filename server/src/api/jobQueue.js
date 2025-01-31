import Queue from "bull";
import { getJobById } from "./controllers/jobController.js";
import { executeCompiler } from "./compiler/compiler.js";

const TOTAL_WORKERS = 5;
const jobQueue = new Queue("job-queue");

jobQueue.process(TOTAL_WORKERS, async ({ data }) => {
  const { jobId } = data;
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error("Job not found!");
  }

  try {
    job.startedAt = new Date();
    const response = await executeCompiler(job.filePath, job.language);
    job.completedAt = new Date();
    job.status = "success";
    job.output = response;

    await job.save();
  } catch (error) {
    job.status = "failed";
    job.output = JSON.stringify(error);
    await job.save();
    console.log(error);
  }

  return true;
});

jobQueue.on("failed", (error) => {
  console.log(
    "Error occurred in job processing: ",
    error.data.jobId,
    error.failedReason
  );
});

const addJobToQueue = async (jobId) => {
  await jobQueue.add({ jobId });
};

export { addJobToQueue };
