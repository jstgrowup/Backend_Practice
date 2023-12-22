import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(loginUser);
// secured routes
router.route("/logout").post(verifyJwt, logoutUser);

router.route("/generateAccessToken").post(refreshAccessToken);

router.route("/change-password").post(verifyJwt, changeCurrentPassword);

router.route("/get-current-user").post(verifyJwt, getCurrentUser);

router
  .route("/updateUserAvatar")
  .post(upload.fields({ name: "avatar" }), verifyJwt, updateUserAvatar);

router
  .route("/updateUserAvatar")
  .post(upload.fields({ name: "coverImage" }), verifyJwt, updateUserCoverImage);
export default router;
