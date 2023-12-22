import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/error.js";
import jwt from "jsonwebtoken";
export const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
   
    if (!token) {
      return res.status(400).send(new ApiError(401, "Unauthorized User"));
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(400).send(new ApiError(401, "Invalid Access Token"));
    }
    req.user = user;
    next();
  } catch (error) {
        throw new ApiError(500, "Something went wrong with the token");
  }
});
