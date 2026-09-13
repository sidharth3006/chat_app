import TryCatch from "../config/TryCatch.js";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../config/redis.js";
import { User } from "../model/User.js"; 
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import type { Response } from "express";

export const loginUser = TryCatch(async (req, res: Response) => { 
     
    const {email} = req.body; 


    const rateLimitKey = `otp:ratelimit:${email}`;
    const rateLimit = await redisClient.get(rateLimitKey); 
    if(rateLimit){
        return res.status(429).json({
            success: false,
            message: "Too many requests, please try again later"
        });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const otpKey = `otp:${email}`; 
    await redisClient.set(otpKey, otp, { EX: 300 }); // 5 minutes expiry
    await redisClient.set(rateLimitKey, "1", { EX: 60 }); // 1 minute expiry 
    
    const message = {
        to: email, 
        subject: "Your OTP for login",
        body: `Your OTP is ${otp} It is valid for 5 minutes`, 
    }; 

    await publishToQueue("send_otp", message);

    res.status(200).json({
        success: true,
        message: "OTP sent successfully"
    });

});  

export const verifyUser = TryCatch(async (req, res: Response) => { 

    const {email, otp:enteredOtp} = req.body; 

    if (!email || !enteredOtp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
    }

    const otpKey = `otp:${email}`; 
    const storedOtp = await redisClient.get(otpKey); 
    
    if(!storedOtp || storedOtp !== enteredOtp){
        return res.status(400).json({
            success: false,
            message: "Invalid OTP"
        });
        return; 
    } 

    await redisClient.del(otpKey);

    let user = await User.findOne({email}) 

    if(!user){
        const name = email.split("@")[0]; 
        user = await User.create({
            email,
            name
        });
    }
    
    const token = generateToken(user) 

    res.json({
        success: true,
        message: "User verified successfully",
        user,
        token,
    })
});   


export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => { 
    const user = req.user;
    res.json({
        success: true,
        user,
    })
});

export const updateName = TryCatch(async (req: AuthenticatedRequest, res: Response) => { 
    const user =await User.findById(req.user?._id); 
    if(!user){
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }
    user.name = req.body.name;
    await user.save(); 
    
    const token = generateToken(user);

    res.json({
        success: true,
        user,
        token,
    })
});

export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const users = await User.find({});
    res.json(users); 
});


export const getAUser = TryCatch(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.params.id);
    res.json(user); 
});
