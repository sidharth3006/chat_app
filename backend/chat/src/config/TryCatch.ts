import type { NextFunction, Request, RequestHandler, Response } from "express"; 

const TryCatch = (handler: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try{ 
            await handler(req, res, next);
        } catch (error: unknown) { 
            const message = error instanceof Error ? error.message : "Something went wrong";
            res.status(500).json({
                success: false,
                message
            });
        }
    };
};

export default TryCatch;
