
"use client"
import React, { useState } from 'react'
import { ArrowRight, Loader2, Mail } from 'lucide-react'
import { redirect, useRouter } from 'next/navigation'
import axios from 'axios'
import { useAppData, user_service } from '@/context/AppContext'
import Loading from '@/components/Loading'
import toast from 'react-hot-toast'




const LoginPage  = () => {

  const [email,setEmail] = useState<string>("") 
  const [loading, setLoading] = useState<boolean>(false) 
  const router = useRouter()

  const {isAuth,loading: userLoading} = useAppData(); 
  
  
  const handleSubmit = async (e: React.FormEvent<HTMLElement>):Promise<void> => { 
    e.preventDefault()
    setLoading(true); 

    try{
        const {data} = await axios.post(`${user_service}/api/v1/login`, {
            email,          
        }); 
        
        toast.success(data.message)
        router.push(`/verify?email=${email}`)

    } catch(error){
      toast.error("Login failed:" + error)
    } finally{
      setLoading(false)
    }

    
  }

  if(userLoading) return <Loading/> 
  if(isAuth) return redirect("/chat")
  
  return (
    <div className = "min-h-screen bg-gray-900 flex items-center justify-center p-4">

        <div className="max-w-md w-full">

            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">

                <div className="text-center mb-8"> 
                    <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center"> 
                        <Mail size={40} className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Welcome to ChatApp</h1> 
                    <p className="text-gray-400">Sign in to continue to your account</p>
                </div>

            <form onSubmit={handleSubmit}  className='space-y-6'>
                <div> 
                    <label htmlFor="email" className='block text-sm font-medium text-gray-300'>Email Address</label>
                    <input 
                        type="email" 
                        id="email" 
                        className='mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500' 
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />
                </div> 
                <button type='submit' className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed' disabled={loading}>
                    {loading ? (
                        <div className='flex items-center justify-center gap-2'>
                            <Loader2 className='w-5 h-5 animate-spin' />
                            Sending...
                        </div>
                    ) : (
                        <div className='flex items-center justify-center gap-2'>
                            <span>Send Verification Code</span> 
                            <ArrowRight className='w-5 h-5' />
                        </div>
                    )}
                </button>
            </form>

            </div>



        </div>
    </div>
  )
}

export default LoginPage 