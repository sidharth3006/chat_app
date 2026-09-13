import express from "express";
import dotenv from "dotenv"; 
import connectDB from "./config/db.js"; 
import { redisClient } from "./config/redis.js";
import userRoutes from "./routes/user.js";
import { connectRabbitMQ } from "./config/rabbitmq.js"; 
import cors from "cors";

dotenv.config();

connectDB(); 

connectRabbitMQ(); 




const app = express();

app.use(express.json());

app.use(cors());

app.use("/api/v1",userRoutes); 

const port = process.env.PORT; 


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});