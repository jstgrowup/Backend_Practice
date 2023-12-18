import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiRespnse } from "../utils/response.js";
import fs from "node:fs/promises";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const userInstance = new User();
    const accessToken = userInstance.generateAccessToken(user, (token) => {
      return token;
    });
    const refreshToken = userInstance.generateRefreshToken(user, (token) => {
      return token;
    });
    user.refreshToken = refreshToken;
    // here i am saving the refresh token in the db
    await user.save({ ValiditeBeforeSave: false });
    // this will actually bypass all the validation checks in mentioned in the model
    return { accessToken, refreshToken };
  } catch (error) {
        throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
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

    if (existingUser) {
      throw new ApiError(409, "User Already exists");
    }
    console.log("req.files:", req.files);
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

    if (avatarLocalPath && coverImageLocalPath) {
      await fs.unlink(avatarLocalPath);
    }
    if (coverImageLocalPath) {
      await fs.unlink(coverImageLocalPath);
    }
    return res
      .status(201)
      .json(new ApiRespnse(200, foundUser, "User registered successfully"));
  } catch (error) {
    console.log("error:", error);
    res.status(500).json(new ApiError(400, error));
  }
});
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(400, "User does not exists");
  }
  const isPassValid = await user.isPasswordCorrect(password);
  if (!isPassValid) {
    throw new ApiError(400, "Password doesnt match");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiRespnse(
        200,
        { loggedInUser, accessToken, refreshToken },
        "User Logged In Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findById(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      {
        new: true,
      }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiRespnse(200, {}, "User Logout successfully"));
  } catch (error) {}
});
export { registerUser, loginUser, logoutUser };
