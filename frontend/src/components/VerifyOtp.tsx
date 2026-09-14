"use client"
import React, { useEffect } from 'react'
import { useState, useRef } from 'react'
import { Lock, Loader2, ArrowRight, ChevronLeft } from 'lucide-react'
import { useSearchParams, useRouter, redirect} from 'next/navigation'
import axios from 'axios' 
import Cookies from 'js-cookie'
import {useAppData, user_service} from '@/context/AppContext';
import Loading from './Loading'
import toast from 'react-hot-toast'

const VerifyOTP = () => {

  const {isAuth,setIsAuth,setUser,loading: userLoading} = useAppData(); 


  const [loading,setLoading] = useState(false); 
  const [otp,setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [error,setError] = useState<string>("");
  const [resendLoading, setResendLoading] = useState(false); 
  const [timer, setTimer] = useState(60);  
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]); 
  const router = useRouter();


  const searchParams = useSearchParams(); 
  const email: string = searchParams.get('email') || '';
   
  useEffect(() => {
    if(timer>0){
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleInputChange = (index: number, value: string) => {
        if(value.length>1) return; 
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError("");

        if(value && index < 5){
            inputRefs.current[index + 1]?.focus();
        }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Backspace' && !otp[index] && index > 0){
        inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if(pastedData.length === 6){
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError("");
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    const otpString = otp.join("") 
    if(otpString.length !== 6){
      setError("Please enter a valid 6-digit OTP");
      return;
    }
    // Add your form submission logic here
    setError(""); 
    setLoading(true); 

    try{
        const {data} = await axios.post(`${user_service}/api/v1/verify`, {email, otp: otpString});
        toast.success(data.message); 
        Cookies.set('token', data.token,{
            expires: 7, 
            secure: false, 
            path: '/'
        });
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setUser(data.user); 
        setIsAuth(true); 

    } catch(error){
        console.error("Error verifying code:", error);
        setError("Failed to verify code. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Add your resend logic here
    setResendLoading(true); 
    setError(""); 
    try{
        const {data} = await axios.post(`${user_service}/api/v1/login`, {email});
        toast.success(data.message); 
        setTimer(60);
    } catch(error){
        console.error("Error resending code:", error);
        setError("Failed to resend code. Please try again.");
    } finally {
        setResendLoading(false);
    }
  };  


  if(userLoading) return <Loading/>; 
  if(isAuth) redirect("/chat");
  return (
        <div className = "min-h-screen bg-gray-900 flex items-center justify-center p-4">

        <div className="max-w-md w-full">

            <div className="bg-gray-800 p-8 rounded-lg shadow-lg">

                <div className="text-center mb-8 relative"> 

                 <button className="absolute top-0 left-0 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1" onClick={() => router.push("/login")}>
                    <ChevronLeft className="w-6 h-6"/> 
                    <span>Back to Login</span>
                 </button>

                    <div className="mx-auto w-20 h-20 bg-blue-600 rounded-lg flex items-center justify-center"> 
                        <Lock size={40} className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">Verify You Email</h1> 
                    <p className="text-gray-400">We have sent a 6-digit code to </p> 
                    <p className="text-blue-400 font-medium">{email}</p>
                </div>

            <form onSubmit={handleSubmit}  className='space-y-6'>
                <div className='text-center'> 
                    <label htmlFor="email" className='block text-sm font-medium text-gray-300 '> Enter your 6 digit OTP here </label>
                    <div className='justify-center flex gap-2 mt-2'>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index===0? handlePaste:undefined}
                                ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el }}
                                className='w-12 h-12 text-center text-xl border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        ))}
                    </div>
                </div> 
                {
                    error && <div className='bg-red-900 border border-red-700 rounded-lg p-3'>
                        <p className='text-red-400'>{error}</p>
                    </div>
                }
                <button type='submit' className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed' disabled={loading}>
                    {loading ? (
                        <div className='flex items-center justify-center gap-2'>
                            <Loader2 className='w-5 h-5 animate-spin' />
                            Verifying
                        </div>
                    ) : (
                        <div className='flex items-center justify-center gap-2'>
                            <span>Verify</span> 
                            <ArrowRight className='w-5 h-5' />
                        </div>
                    )}
                </button>
            </form> 

            <div className="mt-6 text-center">
                <p className="text-gray-400">Didn't receive the code? 
                </p> 

                {
                    timer > 0 ? (
                        <p className="text-gray-400">{timer} seconds</p>
                    ) : (
                        <button className="text-blue-400 hover:underline hover:text-blue-300 font-medium text-sm disabled:opacity-50" onClick={handleResendCode} disabled={resendLoading}>
                            {resendLoading ? "Sending..." : "Resend Code"}
                        </button>
                    )
                }

            </div>

            </div>



        </div>
    </div>
  )
}

export default VerifyOTP