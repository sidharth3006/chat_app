import mongoose, {Document, Schema} from 'mongoose'; 

export interface IChat extends Document{
    users: string[]; 
    latestMessage: {
        text: string; 
        sender: string; 
    }; 

    createdAt: Date; 
    updatedAt: Date; 
}

const schema: Schema<IChat> = new Schema({
    users: [String],
    latestMessage: {
        text: String,
        sender: String
    },
    createdAt: Date,
    updatedAt: Date
});

export default mongoose.model<IChat>('Chat', schema);