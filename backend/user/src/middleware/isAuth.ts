import type { Request, Response, NextFunction } from "express";
import type { IUser } from "../model/User.js";
import jwt, { type JwtPayload } from "jsonwebtoken";


export interface AuthenticatedRequest extends Request {
    user?: IUser | null ;
}


export const isAuth = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try{
        const authHeader = req.headers.authorization;
        
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({message: "Please login - No auth header"});
            return;
        }

        const token = authHeader.split(" ")[1] as string; 

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload; 

        if(!decoded || !decoded.user){ 
            res.status(401).json({message: "Please login - Invalid token"});
            return;
        }

        req.user = decoded.user;
        next();

    }catch(error){
        res.status(401).json({message: "Please login - Token verification failed"});
    }
    
}
