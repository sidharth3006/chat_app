import React from "react"; 
import { Menu, UserCircle } from "lucide-react";
import { User } from "@/context/AppContext";


interface ChatHeaderProps{
    user: User|null; 
    setSidebarOpen: (open: boolean)=> void; 
    isTyping: Boolean;
    onlineUsers: string[]; 
}

const ChatHeader = ({user, setSidebarOpen, isTyping, onlineUsers }: ChatHeaderProps) => {
    console.log("ChatHeader user:", user); // Debug log 
    const isOnline = onlineUsers.includes(user?._id || "");

    return (
        <>

         {/*mobile menu toggle*/}
         <div className="sm:hidden fixed top-4 right-4 z-40">
            <button className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
            </button>
         </div>

         {/* chat header */}
         <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6 relative z-10">

            <div className="flex items-center gap-4">
                { user ? (
                <>
                 <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-8 h-8 text-gray-300"/>}
                    </div>
                    {/* online user setup */}
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                    )}
                 </div>

                 {/* user info */}
                 <div>
                    <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                    {
                         isTyping ? (
                            <div className="text-sm text-blue-400">Typing...</div>
                        ) : (
                            isOnline ? (
                                <div className="text-sm text-green-400">Online</div>
                            ) : (
                                <div className="text-sm text-gray-400">Offline</div>
                            )
                        )
                    }
                 </div>
                </>
                ):(
                    <div className="flex items-center gap-4"> 
                        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                            <UserCircle className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Select a chat</h2>
                            <p className="text-sm text-gray-400">Choose a contact from sidebar to start messaging</p>
                        </div>
                    </div>
                )

                }
            </div>

         </div>
        </>
    )
}

export default ChatHeader;