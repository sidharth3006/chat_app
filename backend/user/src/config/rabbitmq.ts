import amqplib from "amqplib"; 

let channel : amqplib.Channel | null = null;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqplib.connect({
            protocol: "amqp",
            hostname: process.env.RABBITMQ_HOST || "localhost",
            port: parseInt(process.env.RABBITMQ_PORT || "5672"),
            username: process.env.RABBITMQ_USER || "admin",
            password: process.env.RABBITMQ_PASSWORD || "password",
        });
        channel = await connection.createChannel();
        console.log("RabbitMQ connected ✅");
    } catch (error) {
        console.error("RabbitMQ connection error", error);
    }
};

export const publishToQueue = async (queue: string, message: any) => {
    if(!channel){
        throw new Error("RabbitMQ channel is not initialized");
    }
    await channel.assertQueue(queue,{
        durable: true,
    });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)),{
        persistent: true,
    }); 

    
};




