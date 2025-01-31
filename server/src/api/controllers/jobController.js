import Job from '../models/Job.js'

const createJob = async ({ language, filePath }) => {
    try {
        const job = new Job({ language, filePath })
        await job.save()
        console.log({ job })
        return job
    } catch (error) {
        throw new Error(`Error occurred in creating job: ${error}`)
    }
}

const getJobById = async (jobId) => {
    try {
        return await Job.findById(jobId);
    } catch (error) {
        throw new Error(`Error occurred in getting job of given id (${jobId}): ${error}`)
    }
}

export { createJob, getJobById }