// require("dotenv").config();
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
const port = process.env.PORT || 3000;
dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`server connected ${port}`);
    });
  })
  .catch((err) => {
    console.log("mongoDB error", err);
  });
