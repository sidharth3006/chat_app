"use client"; 

import VerifyOTP from "@/components/VerifyOtp";
import Loading from "@/components/Loading"; 
import { Suspense } from "react"; 

const VerifyPage = () => { 
   
    
    return (
        <div>
            <Suspense fallback={<Loading />}>
                <VerifyOTP />
            </Suspense>
        </div>
    );
}

export default VerifyPage; 