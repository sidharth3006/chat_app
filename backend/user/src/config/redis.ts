import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if(!redisUrl){
    throw new Error("REDIS_URL is not defined");
}

export const redisClient = createClient({
    url: redisUrl, 
});  

redisClient.connect().then(()=>console.log("Redis connected ✅")).catch(console.error);
