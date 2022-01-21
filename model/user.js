import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import { otpGenerator } from "../helper";
import { config } from "../config";

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    mobile_number: {
      type: Number,
      unique: true,
      required: true,
      trim: true,
      validate(value) {
        if (value.toString().length !== 10) {
          throw new Error("Invalid mobile number");
        }
      },
    },
    otp_verify: {
      type: Number,
      //  unique: true,
      trim: true,
      default: null,
    },
    profile_completed: {
      type: Boolean,
      default: false,
    },
    tokens: [
      {
        token: {
          type: String,
        },
        device_token: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

userSchema.virtual("order", {
  ref: "Orders",
  localField: "_id",
  foreignField: "user_id",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString(), role: "user" },
    config.JWT_SECRET
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (mobile_number) => {
  const user = await User.findOne({ mobile_number });

  const otp = "0000";

  if (!user) {
    const user = new User({ mobile_number, otp_verify: otp });
    return await user.save();
  }

  user.otp_verify = otp;
  return await user.save();
};

userSchema.statics.verifyUserOtp = async (id, otp) => {
  const user = await User.findOne({ _id: id, otp_verify: otp });
  if (!user) {
    throw new Error("Invalid OTP");
  }
  user.otpVerify = null;
  return await user.save();
};

// GET ?limit=10&skip=20
// GET ?sortBy=createdAt:desc
userSchema.statics.getAllUsersList = async (req) => {
  let where = {},
    data = req.query,
    sortBy = {},
    first_name,
    last_name,
    email,
    mobile_number;

  if (data.query) {
    first_name = data.query;
    last_name = data.query;
    email = data.query;
    mobile_number = data.query;
    where = {
      $or: [
        { first_name: { $regex: first_name, $options: "i" } },
        { last_name: { $regex: last_name, $options: "i" } },
        { email: { $regex: email, $options: "i" } },
        { mobile_number: { $regex: mobile_number, $options: "i" } },
      ],
    };
  }

  if (data.status) {
    where.status = data.status;
  }

  if (data.sort_field) {
    sortBy[data.sort_field] = data.order_by && data.order_by == "asc" ? 1 : -1;
  } else {
    sortBy.created_at = -1;
  }
  return await User.find({}, { token: 0 })
    .where(where)
    .sort(sortBy)
    .skip(parseInt(req.query.skip || 0))
    .limit(parseInt(req.query.limit || 10))
    .lean();
};

const User = mongoose.model("User", userSchema);

export default User;
