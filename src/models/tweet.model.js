import mongoose, { Schema } from "mongoose";
const TweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  {
    timestamps: true,
  }
);
export const Tweets = mongoose.model("Tweets", TweetSchema);
