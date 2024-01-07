import mongoose, { Schema } from "mongoose";
const LikeSchema = new Schema({
  video: {
    type: Schema.Types.ObjectId,
    ref: "Videos",
  },
  comment: {
    type: Schema.Types.ObjectId,
    ref: "comments",
  },
  tweet: {
    type: Schema.Types.ObjectId,
    ref: "tweets",
  },
  likedBy: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
});
export const Likes = mongoose.model("Likes", LikeSchema);
