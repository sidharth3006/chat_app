import amqplib from 'amqplib' 
import nodemailer from 'nodemailer' 
import dotenv from 'dotenv' 
dotenv.config()

export const startSendOtpConsumer = async ()=>{
    try {

        const connection = await amqplib.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST || "localhost",
            port: parseInt(process.env.RABBITMQ_PORT || "5672"),
            username: process.env.RABBITMQ_USER || "admin",
            password: process.env.RABBITMQ_PASSWORD || "password",
        });
        
        const channel = await connection.createChannel(); 

        const queueName = "send_otp";

        await channel.assertQueue(queueName, { durable: true });  

        console.log("Mail Service consumer started, listening for otp emails ✅")

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
        });

        channel.consume(queueName, async (msg)=>{
            if(msg){ 

                try{
                    const {to,subject,body} = JSON.parse(msg.content.toString()) 
                    
                    console.log("Received OTP email:", {to,subject,body})

                    await transporter.sendMail({
                        from: "noreply@chatapp.com",
                        to,
                        subject,
                        text: body
                    });

                    console.log("OTP email sent successfully")
                    channel.ack(msg)
                } catch (error) {
                    console.log("Failed to send email", error)
                    channel.nack(msg, false, false)
                    return
                }
                
            }
        }, { noAck: false })

    } catch (error) {
      console.log("Failed to start send otp consumer", error)  
    }
}