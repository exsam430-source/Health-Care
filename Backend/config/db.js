import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const y = process.env.MONGO_URI;
const ConnectDB = async () =>{
        try {
            await mongoose.connect(y)
            console.log('database conected sucessfuly')
        } catch (error) {
            console.log('DataBase Error' , error)
        }
}

export default ConnectDB;