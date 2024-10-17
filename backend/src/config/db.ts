import mongoose from "mongoose";
import dotenv from "dotenv";
import { MONGODB_URL } from "../constans/env";

// Cargar variables de entorno
dotenv.config();

const connectToDatabase = async () => {
  try {
    // Usar MONGODB_URL para conectarse a MongoDB Atlas
    await mongoose.connect(MONGODB_URL),
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      };
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1); // Terminar la aplicación si la conexión falla
  }
};

export default connectToDatabase;
