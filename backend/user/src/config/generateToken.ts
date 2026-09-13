import jwt from 'jsonwebtoken' 
import dotenv from 'dotenv' 
import type { IUser } from '../model/User.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export const generateToken = (user: IUser) => {
    return jwt.sign({user}, JWT_SECRET, { expiresIn: '7d' })
}