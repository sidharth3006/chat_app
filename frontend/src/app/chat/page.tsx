"use client"
import React, { useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { chat_service, useAppData, User } from '@/context/AppContext'
import Loading from '@/components/Loading';
import ChatSidebar from '@/components/ChatSidebar';
import ChatHeader from '@/components/ChatHeader'; 
import ChatMessages from '@/components/ChatMessages';
import MessageInput from '@/components/MessageInput';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useSocket } from '@/context/SocketContext';


export interface Message {
  _id: string; 
  chatId: string; 
  sender:string; 
  text?: string; 
  image: {
    url: string; 
    path?: string;
    publicId: string; 
  } | null;
  messageType: "text"|"image"; 
  seen: boolean; 
  seenAt?: string; 
  createdAt: string; 
}

const ChatApp = () => { 

  const { socket, onlineUsers } = useSocket();

  const {loading, isAuth, logoutUser, chats, user:loggedInUser, fetchChats,setChats, otherUsers} = useAppData();

  console.log("onlineUsers", onlineUsers);

  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [message,setMessage] = useState(""); 
  const [sidebarOpen, setSidebarOpen] = React.useState(false); 
  const [messages, setMessages] = useState<Message[] | null>(null) 
  const [user,setUser] = useState<User | null>(null) 
  const [showAllUsers, setShowAllUsers] = useState(false); 
  const [isTyping,setIsTyping] = useState(false); // Tracks if current user is typing
  const [otherUserTyping,setOtherUserTyping] = useState(false); // Tracks if other user is typing
  const [typingTimeOut,setTypingTimeOut] = useState<NodeJS.Timeout | null>(null); 


  
  const router = useRouter(); 
  
  useEffect(() => {
    if(!isAuth && !loading) {
      router.push('/login');
    }
  }, [isAuth, loading, router]); 

  async function createChat(u: User){
    try{
      const token = Cookies.get('token');
      const {data} = await axios.post(`${chat_service}/api/v1/chat/new`, {otherUserId: u._id}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedUser(data.chatId);
      setShowAllUsers(false);
      await fetchChats();
    }catch(error){
      console.log(error);
    }
  }  


  const handleMessageSend = async(e: React.FormEvent<HTMLFormElement>, imageFile?: File | null): Promise<boolean> => {
    e.preventDefault(); 

    if(!message.trim() && !imageFile) return false;

    if(!selectedUser) {
      toast.error("Please select a chat first");
      return false;
    }
    

    //socket work
    if(typingTimeOut){
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }

    socket?.emit("stopTyping",{
      chatId: selectedUser,
      userId: user?._id,
    })

    const token = Cookies.get("token");
    
    try{
      const formData = new FormData();
      formData.append("chatId", selectedUser);

      if(imageFile){
        formData.append("image", imageFile);
      }
      formData.append("text", message.trim()); 

      const {data} = await axios.post(`${chat_service}/api/v1/message`,formData,{
        headers:{
          Authorization: `Bearer ${token}`,
        }
      })

      console.log("Message send response:", data); 


      setMessages((prev) => {
        const currentMessages = prev || []; 
        const messageExists = currentMessages.some(msg => msg._id === data.message._id);
        if(messageExists) return currentMessages;
        return [...currentMessages, data.message];

      }); 

      setMessage(""); 
      
      const displayText = imageFile ? "[Image]" : message.trim();

      moveChatToTop(
        selectedUser!,
        {
          text: displayText, 
          sender: data.sender
        }
      )

      toast.success(imageFile ? "Image sent" : "Message sent");
      return true;
      
    } catch (error: unknown) { 
      const axiosError = axios.isAxiosError(error) ? error : null;
      console.error("Failed to send message:", axiosError?.response?.data || error);
      toast.error(axiosError?.response?.data?.message || "Failed to send message");
      return false;
    }
  }

// when the logged in user types in the message input, emit typing event to socket and stop typing after 2 seconds 
  const handleTyping = (value: string) => {
    setMessage(value)

    if(!selectedUser || !socket) return

    //socket setup
    if(!isTyping){
      setIsTyping(true);
      socket.emit("typing",{
        chatId: selectedUser,
        userId: loggedInUser?._id,
      })
    }


    if(typingTimeOut){
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping",{
        chatId: selectedUser,
        userId: loggedInUser?._id,
      })
    }, 2000);

    setTypingTimeOut(timeout);

  };

// this function listens to the typing event from the socket and sets the otherUserTyping state to true if the user is typing
  useEffect(() => {

    socket?.on("newMessage",(message)=>{

      if(selectedUser === message.chatId){ 
        setMessages((prev)=>{
          const currentMessages = prev || []; 
          const messageExists = currentMessages.some(msg => msg._id === message._id);
          if(messageExists) return currentMessages;
          return [...currentMessages, message];
        });

        moveChatToTop(message.chatId, message);
      }else{
        moveChatToTop(message.chatId, message, true);
      }
    })

    socket?.on("messagesSeen",(data)=>{
      console.log("Messages seen:", data);

      if(selectedUser === data.chatId ){
        setMessages((prev)=>{
          if(!prev) return null;
          return prev.map((msg)=>{
            if(msg.sender === loggedInUser?._id && data.messageIds && data.messageIds.includes(msg._id)){
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toISOString(),
              }
            }else if(msg.sender === loggedInUser?._id && !data.messageIds){
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toISOString(),
              }
            }
            return msg;
          })

        })
      }
    })

    socket?.on("userTyping",(data)=>{
      console.log("User is typing:", data);
      if(data.chatId === selectedUser && data.userId !== loggedInUser?._id){
        setOtherUserTyping(true);
      }
    });

    socket?.on("userStoppedTyping",(data)=>{
      console.log("User stopped typing:", data);
      if(data.chatId === selectedUser && data.userId !== loggedInUser?._id){
        setOtherUserTyping(false);
      }
    });

    return () => { 
      socket?.off("newMessage");
      socket?.off("userTyping"); 
      socket?.off("messagesSeen");
      socket?.off("userStoppedTyping");
    }
  },[socket,selectedUser,setChats,loggedInUser?._id]) 


  // this function fetches messages when a user selects a chat and sets the isTyping and otherUserTyping states to false
  useEffect(() => {
    if(selectedUser){
      fetchMessages();
      setIsTyping(false);
      setOtherUserTyping(false);

      resetUnseenCount(selectedUser);

      socket?.emit("joinChat",selectedUser);

      return () => {
        socket?.emit("leaveChat",selectedUser);
        setMessages(null);
      }
    }
  },[selectedUser,socket])


  // this function clears the typing timeout when the component unmounts
  useEffect(()=>{
    return () => {
      if (typingTimeOut){
        clearTimeout(typingTimeOut);
      }
    }
  },[typingTimeOut])

  const moveChatToTop= (chatId: string, newMessage: any,updatedUnseenCount=true)=>{
    setChats((prev)=>{
      if(!prev) return null;

      const updatedChats = [...prev]
      const chatIndex = updatedChats.findIndex((chat) => chat.chat._id === chatId);

      if(chatIndex === -1) return prev;

      const [moveChat] = updatedChats.splice(chatIndex, 1);  

      const updatedChat = {
        ...moveChat, 
        chat:{
          ...moveChat.chat,
          latestMessage: {
            text: newMessage.text, 
            sender: newMessage.sender,
          },
          updatedAt: new Date().toString(),

          unseenCount: updatedUnseenCount && newMessage.sender !== loggedInUser?._id ? (moveChat.chat.unseenCount || 0) + 1 : moveChat.chat.unseenCount,
        },

      };

      updatedChats.unshift(updatedChat);

      return updatedChats;
    })
  }

  const resetUnseenCount = (chatId: string) => {
    
    setChats((prev) => {
      if(!prev) return null; 
      return prev.map((chat) => {
        if(chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0
            }
          };
        }
        return chat;
      });
    });
  }



  async function fetchMessages(){
    if(!selectedUser) return;

    const token = Cookies.get("token");
    try{
      console.log("Fetching messages for chat:", selectedUser);
      const {data} = await axios.get(`${chat_service}/api/v1/message/${selectedUser}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Messages response:", data);
      setMessages(data.messages);
      setUser(data.otherUser || data.user); // Handle both response formats
      await fetchChats();
    }catch(error){
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to fetch messages");
    }
  }

  useEffect(() => {
    if(selectedUser) {
      fetchMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  if(loading) {
    return <Loading/>;
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUsers}
        setShowAllUsers={setShowAllUsers}
        OtherUsers={otherUsers}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={logoutUser}
        createChat={createChat} 
        onlineUsers={onlineUsers}
      />
      <div className="flex-1 flex flex-col justify-between p-4 ml-0 sm:ml-64 backdrop-blur-xl bg-white/5 border-1 border-white/10">
         <ChatHeader user={user} setSidebarOpen={setSidebarOpen} isTyping={otherUserTyping} onlineUsers={onlineUsers} />
         <ChatMessages selectedUser={selectedUser} messages={messages} loggedInUser={loggedInUser} />
         <MessageInput selectedUser={selectedUser} message={message} setMessage={handleTyping} handleMessageSend={handleMessageSend} /> 
      </div>


    </div>
  )
}

export default ChatApp
