import { Message } from '@/app/chat/page'
import { User } from '@/context/AppContext'
import { Check, CheckCheck } from 'lucide-react'
import React, { useEffect, useMemo, useRef } from 'react'

interface ChatMessagesProps{
    selectedUser: string | null 
    messages: Message[] | null 
    loggedInUser: User | null
}

const ChatMessages = ({
    selectedUser, 
    messages, 
    loggedInUser,
}: ChatMessagesProps) => { 

const bottomRef = useRef<HTMLDivElement>(null) 

const uniqueMessages = useMemo(()=>{
  if(!messages) return[] 

  const seen = new Set() 
  return messages.filter(msg => {
    if(seen.has(msg._id)) return false
    seen.add(msg._id)
    return true
  })
}, [messages])

useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [selectedUser, uniqueMessages])





  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full max-h-[calc(100vh-210px)] overflow-y-auto p-2 space-y-2 custom-scroll">
        {
          !selectedUser? <p className="text-gray-400 text-center mt-20">Please select a uer to start chatting 📩</p>:<>
          {
            uniqueMessages.map((e,i)=>{
              const isSentByMe = e.sender === loggedInUser?._id; 
              const uniqueKey = `${e._id}-${i}`
              const imageUrl = e.image?.url || e.image?.path;
              return (
                <div className={`flex flex-col gap-1 mt-2 ${ isSentByMe ? "items-end":"items-start"}`} key={uniqueKey}>
                  
                  <div className={`rounded-lg p-3 max-w-sm ${
                    isSentByMe ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                  }`}>
                    {
                      e.messageType === "image" && imageUrl && (
                        <div className="relative group"> 
                         <img src={imageUrl} alt="image" className="rounded-lg max-w-full h-auto" />
                        </div>
                      )
                    }

                    {
                      e.messageType === "image" && !imageUrl && (
                        <p className="text-sm text-red-200">Image upload did not return a URL.</p>
                      )
                    }

                    {e.text && <p className="mt-1">{e.text}</p>}

                  </div> 

                  <div className={`flex items-center gap-1 text-xs text-gray-400 ${isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"}`}>
                    <span>{new Date(e.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    {
                      isSentByMe && <div className="flex items-center ml-1">
                        {
                          e.seen ? <div className="flex items-center gap-1 text-blue-400">
                             <CheckCheck className="w-3 h-3"/> 
                             {
                              e.seenAt && <span>{new Date(e.seenAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                             }
                            </div> : <div className="flex items-center gap-1 text-gray-400">
                              <Check className="w-3 h-3"/>
                            </div>
                        }
                      </div>
                    }
                  </div>

                </div>
              )
            })
          }
          <div ref={bottomRef} />
          </>
        }
      </div>
    </div>
  )
}

export default ChatMessages
