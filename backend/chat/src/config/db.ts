import mongoose from "mongoose";


const connectDB = async () => { 
    const url = process.env.MONGO_URI; 

    if(!url) {
        throw new Error("MongoDB URL is not defined");
    }

    try {
        await mongoose.connect(url,{
            dbName: "chat_app"
        });
        console.log("MongoDB connected ✅");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

export default connectDB;