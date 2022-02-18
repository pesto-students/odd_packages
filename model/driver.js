import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { otpGenerator } from "../helper";
import { DriverStatics } from ".";

const doc = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "aadhar_card",
        "pan_card",
        "driving_licence",
        "vehicle_insurance",
        "registration_card",
      ],
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approve", "reject"],
    },
    path: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const driverSchema = new mongoose.Schema(
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
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    profile_completed: {
      type: Boolean,
      default: false,
    },
    otp_verify: {
      type: Number,
      trim: true,
      default: null,
    },
    document_submitted: { type: Boolean, default: false },
    address: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    has_order: { type: Boolean, default: false },
    city_postal_code: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    driver_status: {
      type: String,
      default: "pending",
      enum: ["approve", "rejected", "pending"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    vehicle_number: {
      type: String,
    },
    languages: {
      type: String,
      default: "English",
      enum: ["English", "Hindi"],
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
    doc: [doc],
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

driverSchema.virtual("order", {
  ref: "Order",
  localField: "_id",
  foreignField: "driver_id",
});

driverSchema.methods.toJSON = function () {
  const driver = this;
  const driverObject = driver.toObject();

  delete driverObject.password;
  delete driverObject.tokens;

  return driverObject;
};

driverSchema.methods.generateAuthToken = async function () {
  const driver = this;
  const token = jwt.sign(
    { _id: driver._id.toString(), role: "driver" },
    config.JWT_SECRET
  );

  driver.tokens = driver.tokens.concat({ token });
  await driver.save();

  return token;
};

driverSchema.statics.findByCredentials = async (mobile_number) => {
  const driver = await Driver.findOne({ mobile_number });
  // const otp = otpGenerator();
  const otp = "0000";

  if (!driver) {
    const newDriver = new Driver({ mobile_number, otp_verify: otp });
    const stats = DriverStatics({ driver_id: newDriver._id });
    stats.save();
    let data = await newDriver.save();
    return data;
  }

  // driver.otp_verify = otpGenerator();
  driver.otp_verify = "0000";
  return await driver.save();
};

driverSchema.statics.userOtpVerify = async (id, otp) => {
  const driver = await Driver.findOne({ _id: id, otp_verify: otp });
  if (!driver) {
    throw new Error("Invalid OTP");
  }
  driver.otp_verify = null;
  return await driver.save();
};
// GET ?limit=10&skip=20
// GET ?sortBy=createdAt:desc
driverSchema.statics.getAllDriversList = async (req) => {
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
  if (data.driver_status) {
    where.driver_status = data.driver_status;
  }

  if (data.sort_field) {
    sortBy[data.sort_field] = data.order_by && data.order_by == "asc" ? 1 : -1;
  } else {
    sortBy.created_at = -1;
  }
  return await Driver.find()
    .where(where)
    .sort(sortBy)
    .skip(parseInt(req.query.skip || 0))
    .limit(parseInt(req.query.limit || 10))
    .lean();
};

const Driver = mongoose.model("Driver", driverSchema);

export default Driver;
