import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import type { Response } from "express";
import Chat from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";
import dotenv from "dotenv";
import { getRecieverSocketId, io } from "../config/socket.js";
dotenv.config();


export const createNewChat = TryCatch(async(req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const {otherUserId} = req.body; 

   if(!otherUserId){ 
    return res.status(400).json({message: "Other user ID is required"});
   }

   const existingChat = await Chat.findOne({
    users: {
        $all: [userId, otherUserId], 
        $size: 2
    }
   }); 

   if(existingChat){
    res.json({
        message:"Chat already exists", 
        chatId: existingChat._id,
    }) 
    return; 
   } 

   const newChat = await Chat.create({
    users: [userId, otherUserId],
   });
   
   res.json({
    message: "Chat created successfully",
    chatId: newChat._id,
   });
   
})

export const getAllChats = TryCatch(async(req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if(!userId){
        res.status(401).json({
            message: "Unauthorized",
        });
        return;
    }
    
    const chats = await Chat.find({
        users: userId,
    }).sort({updatedAt: -1});

    const chatWithUserData = await Promise.all(chats.map(async(chat) => {
        const otherUserId = chat.users.find((id) => id !== userId);

        const unseenCount = await Messages.countDocuments({
            chatId: chat._id,
            sender: {$ne: userId},
            seen: false,
        });
        
        try{ 

            const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`); 
            return {
                user: data, 
                chat:{
                    ...chat.toObject(), 
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                }
            }
        }catch(error){
            console.error("Error fetching user data:", error);
            return {
                user: {_id: otherUserId,name:"Unknown User"},
                chat: {
                    ...chat.toObject(),
                    latestMessage: chat.latestMessage || null,
                    unseenCount,
                }
            }
        }
    }));
    
    res.json({
        message: "Chats fetched successfully",
        chats: chatWithUserData,
    });
}); 


export const sendMessage = TryCatch(async(req: AuthenticatedRequest, res: Response) => {
    const senderId = req.user?._id 
    const {chatId, text} = req.body; 
    const imageFile = req.file; 

    if(!senderId){
        res.status(401).json({
            message: "Unauthorized",
        });
        return;
    } 

    if(!chatId){
        res.status(400).json({
            message: "ChatId Required",
        }); 
        return; 
    } 

    if(!text && !imageFile){
        res.status(400).json({
            message: "Either text or image is required", 
        }) 
        return; 
    } 

    const chat = await Chat.findById(chatId); 

    if(!chat){
        res.status(404).json({
            message: "Chat not found",
        }); 
        return; 
    } 

    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === senderId.toString()
    ); 

    if(!isUserInChat){
        res.status(403).json({
            message: "You are not participant of this chat"
        }); 
        return; 
    }

    const otherUserId = chat.users.find(
        (userId) => userId.toString() !== senderId.toString()
    ); 
    
    if(!otherUserId){
        res.status(404).json({
            message: "Other user not found",
        }); 
        return; 
    }
     
    //socket setup 
    const receiverSocketId = getRecieverSocketId(otherUserId.toString());
    let isReceiverInChatRoom = false; 

    if(receiverSocketId){
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        if(receiverSocket && receiverSocket.rooms.has(chatId)){
            isReceiverInChatRoom = true;
        }
    }



    let messageData: any  = {
        chatId: chatId, 
        sender: senderId, 
        seen: isReceiverInChatRoom, 
        seenAt: isReceiverInChatRoom ? new Date() : undefined, 
    }
    
    if(imageFile){ 
        messageData.image = {
            url: imageFile.path, 
            publicId: imageFile.filename,
        }; 
        messageData.messageType = "image"; 
        messageData.text = text || ""; 
    }else{
        messageData.text=text; 
        messageData.messageType = "text"; 
    } 

    const message = new Messages(messageData);
    const savedMessage = await message.save();
    
    const latestMessageText = imageFile? "📷 Image":text; 

    await Chat.findByIdAndUpdate(
        chatId,
        {
            latestMessage:{
                text: latestMessageText, 
                sender: senderId, 
            },
            updatedAt: new Date(),
        },
        {new: true}
    )

    //emits to sockets 

    io.to(chatId).emit("newMessage", savedMessage);
    
    if(receiverSocketId && !isReceiverInChatRoom){
        io.to(receiverSocketId).emit("newMessage", savedMessage);
    }

    const senderSocketId = getRecieverSocketId(senderId.toString());
    if(senderSocketId){
        io.to(senderSocketId).emit("newMessage", savedMessage);
    }

    if(isReceiverInChatRoom && senderSocketId){
        io.to(senderSocketId).emit("messageSeen",{
            chatId: chatId, 
            seenBy: otherUserId, 
            messageIds: [savedMessage._id],
        });
    }
    


    res.status(201).json({
        message: savedMessage,
        sender: senderId,
        receiver: otherUserId,
    });
});


export const getMessageByChat = TryCatch(async(req:AuthenticatedRequest,res:Response)=>{
    
    const userId = req.user?._id; 
    
    if(!userId){
        res.status(401).json({
            message: "UserId is required",
        }); 
        return; 
    }
    
    const {chatId} = req.params;
    
    if(!chatId){
        res.status(400).json({
            message: "ChatId is required",
        }); 
        return; 
    } 

    const chat = await Chat.findById(chatId); 
    
    if(!chat){
        res.status(404).json({
            message: "Chat not found",
        }); 
        return; 
    }
    
    const isUserInChat = chat.users.some(
        (userId) => userId.toString() === userId.toString()
    ); 
    
    if(!isUserInChat){
        res.status(403).json({
            message: "You are not participant of this chat"
        }); 
        return; 
    } 

    const messagesToMarkSeen = await Messages.find({
        chatId,
        sender: {$ne: userId},
        seen: false,
    }); 

    await Messages.updateMany(
        { 
            chatId,
            sender: {$ne: userId},
            seen: false,
        },
        {
            seen: true,
            seenAt: new Date(),
        }
    );
    
    const messages = await Messages.find({
        chatId,
    }).sort({createdAt: 1});
    

    const otherUserId = chat.users.find((id) => id.toString() !== userId.toString()); 
    
    try{
        const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`); 
        console.log(data); 
        if(!otherUserId){
            res.status(404).json({
                message: "Other user not found",
            }); 
            return; 
        } 

        //socket work 
        if(messagesToMarkSeen.length > 0){
            const receiverSocketId = getRecieverSocketId(otherUserId.toString());
            if(receiverSocketId){
                io.to(receiverSocketId).emit("messageSeen",{
                    chatId: chatId, 
                    seenBy: userId, 
                    messageIds: messagesToMarkSeen.map(msg => msg._id),
                });
            }
        }

        res.json({
            message: "Messages fetched successfully",
            messages,
            otherUser: data,
        });

    }catch(error){
        console.log(error);  
        res.json({
            messages, 
            user: {_id: otherUserId,name: "Unknown User"},
        })
    }


    
})
