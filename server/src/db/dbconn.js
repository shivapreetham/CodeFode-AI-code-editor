import mongoose from "mongoose";

mongoose.set("strictQuery", false);
console.log("mongodb uri", process.env.MONGODB_URI);

const connectDB = (uri) => {
  console.log("uri", uri);
  
  if (mongoose.connection.readyState === 1) {
    console.log("mongodb already connected");
    return;
  }
  mongoose
    .connect(uri)
    .then(() => console.log("[mongodb] connected successfully..."))
    .catch((err) => console.log(err));
};

export default connectDB;
