"use client"
import { createContext, useState,useContext, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, {Toaster} from 'react-hot-toast'

export const user_service = "http://localhost:5000"
export const chat_service = "http://localhost:5002"

export interface User{
    _id: string;
    name: string;
    email: string;
}

export interface Chat{
    _id: string; 
    users: string[]; 
    latestMessage:{
        text: string; 
        sender: string;
    } 
    createdAt: string; 
    updatedAt: string; 
    unseenCount?: number;
}

export interface Chats{
    _id: string; 
    user: User; 
    chat: Chat; 
}

interface AppContextType{
    user: User|null; 
    loading: boolean; 
    isAuth: boolean; 
    setUser: React.Dispatch<React.SetStateAction<User|null>>; 
    setIsAuth: React.Dispatch<React.SetStateAction<boolean>>; 
    setLoading: React.Dispatch<React.SetStateAction<boolean>>; 

}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps{
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({children}) => {
    
    const [user, setUser] = useState<User | null>(null); 
    const [isAuth, setIsAuth] = useState(false); 
    const [loading, setLoading] = useState(false);

    async function fetchUser(){
        setLoading(true);
        try{
           const token = Cookies.get("token");

           if(!token){
               setIsAuth(false);
               setUser(null);
               setLoading(false);
               return;
           }

           const {data} = await axios.get(`${user_service}/api/v1/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
           });
           setUser(data.user);
           setIsAuth(true);
           setLoading(false);
        }catch(error){
           console.log(error);
           setIsAuth(false);
           setUser(null);
           setLoading(false);
        }
    }
    
    async function logoutUser(){
        try{
            const token = Cookies.get("token");
            if(token){
                Cookies.remove("token");
            }
            setIsAuth(false);
            setUser(null);
            toast.success("Logged out successfully");
        }catch(error){
            console.log(error);
            toast.error("Failed to logout");
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AppContext.Provider value={{user,setUser,isAuth, setIsAuth, loading, setLoading}}>
            {children}
            <Toaster />
        </AppContext.Provider>
    )
}

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext); 
    if(!context){
        throw new Error("useAppData must be used within AppProvider");
    }
    return context;
}