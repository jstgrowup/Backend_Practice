import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiRespnse } from "../utils/response.js";
import fs from "node:fs/promises";

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { fullname, email, username, password } = req.body;

    if (
      [fullname, email, username, password].some((field) => field?.trim() == "")
    ) {
      throw new ApiError(400, "Fullname is required");
    }
    let existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    console.log("here");
    if (existingUser) {
      throw ApiError(409, "User Already exists");
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath =
      req.files?.coverImage?.length > 0 ? req.files?.coverImage[0].path : "";
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });
    const foundUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!foundUser) {
      throw new ApiError(400, "something went wrong in registering");
    }
    if (avatarLocalPath.length > 0 && coverImageLocalPath.length > 0) {
      await fs.unlink(avatarLocalPath);
      await fs.unlink(coverImageLocalPath);
    }
    return res
      .status(201)
      .json(new ApiRespnse(200, foundUser, "User registered successfully"));
  } catch (error) {
    console.log("error:", error);
    throw new ApiError(400, error);
  }
});
export { registerUser };
