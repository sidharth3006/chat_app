"use client"
import React, { useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import { useAppData, User } from '@/context/AppContext'
import Loading from '@/components/Loading';
import ChatSidebar from '@/components/ChatSidebar';


export interface Message {
  _id: string; 
  chatId: string; 
  sender:string; 
  text?: string; 
  image: {
    url: string; 
    publicId: string; 
  } 
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
      /> 
    </div>
  )
}

export default ChatApp