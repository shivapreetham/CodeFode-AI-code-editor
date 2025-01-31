import mongoose from "mongoose";

mongoose.set("strictQuery", false);
console.log("mongodb uri", process.env.MONGODB_URI);

const connectDB = () => {
  if (mongoose.connection.readyState === 1) {
    console.log("mongodb already connected");
    return;
  }
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("[mongodb] connected successfully..."))
    .catch((err) => console.log(err));
};

export default connectDB;
