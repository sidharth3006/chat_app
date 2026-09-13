import mongoose, {Document,Schema,Types} from "mongoose";

export interface IMessage extends Document{
    chatId: Types.ObjectId;
    sender: string;
    text?: string;
    image?:{
        url: string;
        publicId: string;
    }; 
    messageType: "text" | "image"
    seen: boolean; 
    seenAt?: Date; 
    createdAt: Date;
    updatedAt: Date;
}
 
const schema = new mongoose.Schema<IMessage>({
    chatId: {type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true},
    sender: {type: String, required: true},
    text: {type: String},
    image: {
        url: {type: String},
        publicId: {type: String}
    },
    messageType: {type: String, enum: ["text", "image"],default:"text", required: true},
    seen: {type: Boolean, default: false},
    seenAt: {type: Date, default: null},
    createdAt: {type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now}
}); 


export const Messages = mongoose.model<IMessage>("Message", schema);