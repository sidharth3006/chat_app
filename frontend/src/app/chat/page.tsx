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

  const {loading, isAuth, logoutUser, chats, user:loggedInUser, fetchChats,setChats, otherUsers} = useAppData(); 

  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [message,setMessage] = useState(""); 
  const [sidebarOpen, setSidebarOpen] = React.useState(false); 
  const [messages, setMessages] = useState<Message[] | null>(null) 
  const [user,setUser] = useState<User | null>(null) 
  const [showAllUsers, setShowAllUsers] = useState(false); 
  const [isTyping,setIsTyping] = useState(false); 
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

      toast.success(imageFile ? "Image sent" : "Message sent");
      return true;
      
    } catch (error: unknown) { 
      const axiosError = axios.isAxiosError(error) ? error : null;
      console.error("Failed to send message:", axiosError?.response?.data || error);
      toast.error(axiosError?.response?.data?.message || "Failed to send message");
      return false;
    }
  }


  const handleTyping = (value: string) => {
    setMessage(value) 

    if(!selectedUser) return 

    //socket setup
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
      />
      <div className="flex-1 flex flex-col justify-between p-4 ml-0 sm:ml-64 backdrop-blur-xl bg-white/5 border-1 border-white/10">
         <ChatHeader user={user} setSidebarOpen={setSidebarOpen} isTyping={isTyping} />
         <ChatMessages selectedUser={selectedUser} messages={messages} loggedInUser={loggedInUser} />
         <MessageInput selectedUser={selectedUser} message={message} setMessage={handleTyping} handleMessageSend={handleMessageSend} /> 
      </div>


    </div>
  )
}

export default ChatApp
