"use client"
import React, { useState, useEffect } from 'react'
import { useAppData, user_service } from '@/context/AppContext'
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import { ArrowLeft, Edit, Save, UserCircle } from 'lucide-react';

const Profile = () => {
  const { user,isAuth, loading,setUser } = useAppData();
  
  const [isEdit, setIsEdit] = React.useState(false); 
  const [name,setName] = useState<string | undefined>("") 

  const router = useRouter() 

  const editHandler = () => {
    setIsEdit(!isEdit); 
    setName(user?.name || "");
  }

  const submitHandler = async (e: any)=>{
    e.preventDefault() 
    const token = Cookies.get("token")
    try{
        const {data} = await axios.post(`${user_service}/api/v1/update/user`,{name},{
            headers:{
                "Authorization": `Bearer ${token}`
            }
        }) 

        Cookies.set("token", data.token,{
            expires: 15, 
            secure: false, 
            path: "/",
        });  
        toast.success("Profile updated successfully") 
        setUser(data.user) 
        setIsEdit(false)
    }catch(error: any){ 
        toast.error(error.response.data.message)
        console.log(error)
    }
  }; 

  useEffect(() => {
    if (loading) return; // Wait for loading to complete

    if (!isAuth) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  if (loading) return <Loading/>; 
  
  

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="flex items-center gap-4 mb-8"> 
            <button onClick={() => router.push("/")} className='bg-blue-500 text-white px-4 py-2 rounded'>
              <ArrowLeft className='w-5 h-5 text-gray-300' />
            </button>
            <div>
              <h1 className='text-2xl font-bold text-white'>Profile Settings</h1> 
              <p className='text-gray-400'>Manage your profile information</p>
            </div>
        </div>
         
         <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
            <div className='bg-gray-700 p-8 border-b border-gray-600'>
              <div className="flex items-center gap-6">
                <div className='w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center relative'>
                  <UserCircle className='w-10 h-10 text-gray-400' />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800"></div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
                  <p className="text-gray-400">{user?.email}</p>
                  <p className="text-gray-400">Active Now</p>
                </div>
              </div>
            </div>
          
          <div className="p-8">

            <div className="space-y-6">
              <div> 

                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="name">Display Name</label>
                {
                  isEdit ? <form onSubmit={submitHandler} className="space-y-4"> 
                      <div className="relative">
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>

                      <div className="flex gap-3">
                        <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          <Save className='w-5 h-5' />
                          Save Changes
                        </button>
                        <button type="button" onClick={editHandler} className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form> : <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <span className="text-white">{user?.name}</span>
                      <button type="button" onClick={editHandler} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <Edit className='w-4 h-4' />
                        Edit
                      </button>
                    </div>
                }

              </div>

            </div>
            
          </div>


         </div>
      </div>
    </div>
  )
}

export default Profile