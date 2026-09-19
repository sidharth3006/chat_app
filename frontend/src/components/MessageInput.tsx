import { Paperclip, X } from 'lucide-react';
import React, { useState } from 'react'

interface MessageInputProps{
    selectedUser: string | null; 
    message: string; 
    setMessage: (message: string) => void; 
    handleMessageSend: (e: React.FormEvent<HTMLFormElement>, images?: File | null) => Promise<boolean>; 
}

const MessageInput = ({selectedUser, message, setMessage, handleMessageSend}: MessageInputProps) => {

  const [imageFile, setImageFile] = useState<File | null>(null); 
  const [isUploading, setIsUploading] = useState(false); 
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;

  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() 
    if(!message.trim() && !imageFile) return 
    
    setIsUploading(true)
    const sent = await handleMessageSend(e, imageFile)
    if(sent) {
      setImageFile(null)
    }
    setIsUploading(false) 

  } 

  React.useEffect(() => {
    return () => {
      if(previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl])

  if (!selectedUser) return null;
  return (  
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t border-gray-700 pt-2"> 

     {
        imageFile && previewUrl && <div className="relative w-fit">
          <img src={previewUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-gray-600" /> 
          <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

     }

     <div className="flex items-center gap-2">
      <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors ">
        <Paperclip size={18} className="text-gray-300"/>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0]; 
          if(file && file.type.startsWith("image/")){
            setImageFile(file); 
          }
        } }/>
      </label> 

      <input type="text" className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400" placeholder={imageFile ? "Add a caption..." : "Type a message..."} value={message} onChange={e => setMessage(e.target.value)} />

      <button type="submit" disabled={isUploading || (!message.trim() && !imageFile)} className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 transition-colors">
        {isUploading ? "Sending..." : "Send"}
      </button>

     </div>
      
    </form>
  )
}

export default MessageInput
