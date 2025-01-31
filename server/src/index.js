import express from "express";
import cors from 'cors'
import { initSocketServer } from "./socket/socket_server.js";
import { initApiRoutes } from "./api/api.js";
import connectDB from "./db/dbconn.js";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.use(cors({
    origin: '*'
}))

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

connectDB()
initApiRoutes(app);
initSocketServer(app);
