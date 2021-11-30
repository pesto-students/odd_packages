import mongoose from "mongoose";
const location = new mongoose.Schema({
  complete_address: {
    type: String,
    default: "",
  },
  add_1: {
    type: String,
    default: "",
  },
  add_2: {
    type: String,
    default: "",
  },
  contact_person_name: {
    type: String,
    default: "",
  },
  contact_person_number: {
    type: String,
    default: "",
  },
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  instruction: {
    type: String,
    default: "",
  },
});

const track_history = new mongoose.Schema(
  {
    status: {
      type: String,
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      default: "",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    status: {
      type: String,
      default: "open",
      enum: ["open", "accepted", "inprogress", "cancel", "delivered"],
    },
    track_history: [track_history],
    pickup_info: location,
    pickup_otp: {
      type: String,
    },
    drop_off_info: location,
    drop_off_otp: {
      type: String,
    },
    fare: {
      type: Number,
    },
    driver_distance: {
      type: Number,
    },
    distance: {
      type: Number,
    },
    payment_status: {
      type: Boolean,
      default: false,
    },
    payment_data: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

/*
 * Get forum list
 */
orderSchema.statics.getAllOrderList = async (req) => {
  let where = {},
    data = req.query,
    sortBy = {};
  if (data.status === "live") {
    where.status = ["open", "accepted", "inprogress"];
  } else if (data.status === "past") {
    where.status = ["cancel", "delivered"];
  } else if (data.status) {
    where.status = data.status;
  }

  if (data.sort_field) {
    sortBy[data.sort_field] = data.order_by && data.order_by == "asc" ? 1 : -1;
  } else {
    sortBy.created_at = -1;
  }
  return await Order.find(where)
    .populate("user_id")
    .populate({ path: "driver_id", select: { last_name: 1, first_name: 1 } })
    .populate("vehicle_id")
    .sort(sortBy)
    .skip(parseInt(req.query.skip || 0))
    .limit(parseInt(req.query.limit || 10))
    .lean();
};

const Order = mongoose.model("Order", orderSchema);

export default Order;
