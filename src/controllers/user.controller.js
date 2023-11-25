import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { User } from "../models/user.model.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;
  if (
    [fullname, email, username, password].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(400, "Fullname is required");
  }
  let existingUser = User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw ApiError(409, "User Already exists");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }
  
  res.send("ok");
});
export { registerUser };
