import { User } from '@/context/AppContext';
import React, { useState } from 'react'
import { X, MessageCircle, Plus, Search, UserCircle,CornerUpLeft, CornerDownRight,LogOut, User as UserIcon } from 'lucide-react'
import Link from 'next/link';


interface ChatSidebarProps{
    sidebarOpen: boolean; 
    setSidebarOpen: (open: boolean) => void; 
    showAllUsers: boolean; 
    setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
    OtherUsers: User[] | null; 
    loggedInUser: User | null; 
    chats: any[] | null; 
    selectedUser: string | null; 
    setSelectedUser: (userId: string | null) => void;  
    handleLogout: ()=>void; 
    createChat: (user: User) => Promise<void>;
    onlineUsers: string[];
}


const ChatSidebar = ({sidebarOpen, setSidebarOpen, showAllUsers, setShowAllUsers, OtherUsers,loggedInUser, chats,setSelectedUser, selectedUser, handleLogout, createChat, onlineUsers}: ChatSidebarProps) => { 
    const [searchQuery, setSearchQuery] = useState<string>('');   

    console.log("Online users from sidebar:", onlineUsers)
    return ( 
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0 flex flex-col`}>
        {/* Header */} 
        <div className="p-6 border-b border-gray-700">

          <div className="sm:hidden flex justify-end mb-0">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}><X className="w-6 h-6 text-gray-300" /></button>            
          </div>
           
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 justify-between"> 
                    <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                    {showAllUsers ? "New Chat":"Messages"}
                </h2>
            </div>
            
            <button onClick={() => setShowAllUsers(!showAllUsers)} className={`p-2.5 hover:bg-gray-700 rounded-lg transition-colors ${showAllUsers ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
               {
                showAllUsers ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />
               }
            </button>
         </div>
         </div>

         {/* content */}
         <div className="flex-1 overflow-hidden px-4 py-2">
            {
                showAllUsers ? (
                    // Show all users
                    <div className='space-y-4 h-full'>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* other user list */}
                        <div className="space-y-2 overflow-y-auto h-full">
                            {
                                OtherUsers?.filter((u) => u._id !== loggedInUser?._id && u.name.toLowerCase().includes(searchQuery.toLowerCase())).map((user) => (
                                    <button key={user._id} className="w-full text-left" onClick={() => createChat(user)}>
                                        <div className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg transition-colors">
                                            <div className="relative">
                                                <UserCircle className="w-10 h-10 text-gray-400" />
                                                {/* online symbol */}
                                                {
                                                    onlineUsers.includes(user._id) && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                                    )
                                                }
                                                
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <span className="block truncate text-white font-medium">{user.name}</span>
                                                <div className="text-xs text-gray-400">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            }
                        </div>

                    </div>


                ) : (
                    // Show chats
                    chats && chats.length > 0 ? (
                        <div className="space-y-2 overflow-y-auto h-full pb-4">
                            {
                                chats.map((chat) => {
                                    const latestMessage = chat.chat.latestMessage;
                                    const isSelected = selectedUser === chat.chat._id;
                                    const isSentByMe = latestMessage?.sender === loggedInUser?._id;
                                    return (
                                        <button
                                            key={chat.chat._id}
                                            onClick={() => {
                                                setSelectedUser(chat.chat._id);
                                                setSidebarOpen(false);
                                            }}
                                            className={`w-full text-left p-4 rounded-lg transition-colors ${isSelected ? "bg-blue-600 border border-blue-500" : "bg-gray-800 hover:bg-gray-700"}`}
                                        >
                                            <div className="flex items-center gap-3">

                                               <div className="relative">
                                                 <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center"> 
                                                    <UserCircle className="w-7 h-7 text-gray-300" /> 
                                                    {/* onlineuser */ } 
                                                    {
                                                        onlineUsers.includes(chat.user._id) && (
                                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                                        )
                                                    }
                                                

                                                 </div>
                                               </div>

                                                <div className="flex-1 min-w-0"> 
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className={`font-semibold truncate ${isSelected ? "text-white" : "text-gray-300"}`}>
                                                            {chat.user.name}
                                                        </span>
                                                        {
                                                            chat.chat.unseenCount >0 && <div className="bg-red-600 text-white text-xs font-bold rounded-full h-5.5 flex items-center justify-center w-5.5 px-2">
                                                                {chat.chat.unseenCount}
                                                            </div>
                                                        }
                                                    </div> 
                                                    {
                                                        latestMessage && (
                                                            <div className="flex items-center gap-2"> 
                                                               {isSentByMe ? <CornerUpLeft size={16} className="text-blue-400 text-shrink-0" /> : <CornerDownRight size={16} className="text-green-400 text-shrink-0" />} 
                                                               <span className="text-gray-400 text-sm truncate">
                                                                 {latestMessage.text}
                                                               </span>
                                                            </div>
                                                        )
                                                    } 
                                                </div>

                                            </div>
                                        </button>
                                    );
                                })
                            }
                        </div>
                    ) : <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 bg-gray-700 rounded-full mb-4">
                            <MessageCircle size={48} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500">No chats found</p> 
                        <p className="text-gray-500 text-sm">Start a new conversation</p>
                    </div>

                )
            }
         </div>

      {/* footer */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <Link href={'/profile'} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-600 transition-colors">
          <div className="w-10 h-10 rounded-full flex items-center justify-center">
            <UserCircle size={20} className="w-4 h-4 text-gray-400" />
          </div> 
          <span className="text-gray-400">Profile</span>
        </Link>

        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-red-600 transition-colors">
          <div className="w-10 h-10 rounded-full bg-red-700 flex items-center justify-center">
            <LogOut size={20} className="w-4 h-4 text-gray-400" />
          </div> 
          <span className="text-gray-400">Logout</span>
        </button>
      </div> 

      </aside>
  )
}

export default ChatSidebar