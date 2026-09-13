import type { NextFunction, Request, RequestHandler, Response } from "express"; 

const TryCatch = (handler: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try{ 
            await handler(req, res, next);
        } catch (error:any) { 
            res.status(500).json({
                success: false,
                message: error.message
            });
            next(error);
        }
    };
};

export default TryCatch;