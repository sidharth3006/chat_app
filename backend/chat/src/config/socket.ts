import { Server, Socket } from "socket.io"; 
import http from "http"; 
import express from "express"; 

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors:{
        origin: "*", 
        methods: ["GET", "POST"],
    }
})

const userSocketMap: Record<string, string> = {};

io.on("connection",(socket: Socket) => {
    console.log("User connected", socket.id);

    const userId = socket.handshake.query.userId as string | undefined; 

    if(userId && userId !== "undefined"){
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} mapped to socket ID ${socket.id}`);
    }  

    if(userId){
        socket.join(userId)
    }

    socket.on("joinChat",(chatId:string)=>{
        console.log(`User ${userId} joined chat ${chatId}`);
        socket.join(chatId);
    })

    socket.on("leaveChat",(chatId:string)=>{
        console.log(`User ${userId} left chat ${chatId}`);
        socket.leave(chatId);
    })

    socket.on("typing",(data)=>{
        console.log(`User ${data.userId} is typing in chat ${data.chatId}`); 
        socket.to(data.chatId).emit("userTyping",{
            chatId: data.chatId, 
            userId: data.userId
        })
    })

    socket.on("stopTyping",(data)=>{
        console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`); 
        socket.to(data.chatId).emit("userStoppedTyping",{
            chatId: data.chatId, 
            userId: data.userId
        })
    })

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);

        if(userId){
            delete userSocketMap[userId];
            console.log(`User ${userId} removed from socket map`);
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    }); 
    
    socket.on("connect_error", (err) => {
        console.log("Connection error", err.message);
    });
});


export { app, server, io, userSocketMap };

