import { Schema, model } from 'mongoose'

const jobSchema = Schema({
    language: {
        type: String,
        required: true,
        enums: ['cpp','python','javascript']
    },
    filePath: {
        type: String,
        required: true
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    output: {
        type: String
    },
    status: {
        type: String,
        default: 'pending',
        enums: ['pending','success','failed']
    }
}, {
    timestamps: true
})

const Job = model('Job', jobSchema)

export default Job