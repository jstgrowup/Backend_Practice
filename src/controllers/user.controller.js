import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileupload.js";
import { ApiRespnse } from "../utils/response.js";
import fs from "node:fs/promises";
import jwt from "jsonwebtoken";
import deleteExistingImage from "../utils/deleteExistingImage.js";
import mongoose from "mongoose";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const userInstance = new User();
    const accessToken = userInstance.generateAccessToken(user, (err, token) => {
      return token;
    });

    const refreshToken = userInstance.generateRefreshToken(
      user,
      (err, token) => {
        return token;
      }
    );
    user.refreshToken = refreshToken;
    // here i am saving the refresh token in the db
    await user.save({ ValiditeBeforeSave: false });
    // this will actually bypass all the validation checks in mentioned in the model

    return { accessToken, refreshToken };
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(
          500,
          "Something went wrong while generating refresh and access token"
        )
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
    await deleteExistingImage(avatarLocalPath);
    await deleteExistingImage(coverImageLocalPath);

    return res
      .status(201)
      .json(new ApiRespnse(200, foundUser, "User registered successfully"));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(
          500,
          "Something went wrong while generating refresh and access token"
        )
      );
  }
});
const loginUser = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    return res
      .status(500)
      .send(new ApiError(500, "Something went wrong while login"));
  }
});
const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: {
        refreshToken: 1,
      },
    });
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiRespnse(200, {}, "User Logout successfully"));
  } catch (error) {
    return res
      .status(500)
      .send(new ApiError(500, "Something went wrong while logout"));
  }
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "unauthorized request");
    }
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
      user._id
    );
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiRespnse(
          200,
          { accessToken, refreshToken: refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    console.log("error:", error);
    return res
      .status(500)
      .send(
        new ApiError(500, "Something went wrong while cerating refresh token")
      );
  }
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req?.user?._id);
    const checkPassword = await user.isPasswordCorrect(oldPassword);
    if (!checkPassword) {
      return res.status(400).json(new ApiError(400, "Invalid password"));
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .send(new ApiRespnse(200, {}, "Password successfully changed"));
  } catch (error) {
    console.log("error:", error);
    return res
      .status(500)
      .send(
        new ApiError(500, "Something went wrong while cerating refresh token")
      );
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json(new ApiRespnse(200, user));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(500, "Something went wrong while getting current user")
      );
  }
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  try {
    const avatarLocalpath = req.file?.path;
    if (!avatarLocalpath) {
      return res.status(400).send(new ApiError(400, "No files detected"));
    }
    const uploadedAvatar = await uploadOnCloudinary(avatarLocalpath);
    if (!uploadedAvatar.url) {
      return res.status(400).send(new ApiError(400, "Error while uploading"));
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
      $set: { avatar: uploadedAvatar.url },
    }).select("-password");
    await deleteExistingImage(avatarLocalpath);
    return res
      .status(200)
      .json(new ApiRespnse(200, user, "Avatar Image updated Successfully"));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(500, "Something went wrong while uploading avatar image")
      );
  }
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  try {
    const coverImageLocalpath = req.file?.path;
    if (!coverImageLocalpath) {
      return res.status(400).send(new ApiError(400, "No files detected"));
    }
    const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalpath);
    if (!uploadedCoverImage.url) {
      return res.status(400).send(new ApiError(400, "Error while uploading"));
    }
    const user = await User.findByIdAndUpdate(req.user._id, {
      $set: { coverImage: uploadedCoverImage.url },
    }).select("-password");
    await deleteExistingImage(coverImageLocalpath);
    return res
      .status(200)
      .json(new ApiRespnse(200, user, "Avatar Image updated Successfully"));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(500, "Something went wrong while uploading coverimage")
      );
  }
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  try {
    const { username } = req.params;
    if (!username?.trim()) {
      return res.status(400).send(new ApiError(400, "Username is missing"));
    }
    const channel = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscribersCount: 1,
          channelsSubscribedToCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          email: 1,
        },
      },
    ]);
    if (!channel?.length) {
      return res.status(400).send(new ApiError(400, "Channel doesnot exists"));
    }
    return res.status(200).send(new ApiRespnse(200, channel[0]));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(
          500,
          "Something went wrong while getting the channel information"
        )
      );
  }
});
const getWatchHistory = asyncHandler(async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "Videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "Users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullname: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                owner: {
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).send(new ApiRespnse(200, user[0].watchHistory));
  } catch (error) {
    return res
      .status(500)
      .send(
        new ApiError(
          500,
          "Something went wrong while getting the channel information"
        )
      );
  }
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserCoverImage,
  updateUserAvatar,
  getUserChannelProfile,
  getWatchHistory
};
