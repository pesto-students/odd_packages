import mongoose from "mongoose";

const schema = new mongoose.Schema({
  name: {
    type: String,
  },
  image: {
    type: String,
  },
  recommendation: {
    type: String,
  },
  base_fare: {
    type: Number,
  },
  per_km: {
    type: Number,
  },
  status: {
    type: String,
    default: "active",
    enum: ["active", "inactive"],
  },
});

schema.statics.create_vehicle = async ({
  name,
  image,
  recommendation,
  base_fare,
  per_km,
}) => {
  const vehicle = new Vehicle({
    name,
    image,
    recommendation,
    base_fare,
    per_km,
  });
  return await vehicle.save();
};

// GET ?limit=10&skip=20
// GET ?sortBy=createdAt:desc
schema.statics.getAllVehicleList = async (req) => {
  let where = {},
    data = req.query,
    sortBy = {},
    name;

  if (data.query) {
    name = data.query;

    where = {
      $or: [{ name: { $regex: name, $options: "i" } }],
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
  return await Vehicle.find()
    .where(where)
    .sort(sortBy)
    .skip(parseInt(req.query.skip || 0))
    .limit(parseInt(req.query.limit || 10))
    .lean();
};

const Vehicle = mongoose.model("Vehicle", schema);

(async () => {
  const count = await Vehicle.countDocuments();
  if (count) return;
  Vehicle.insertMany([
    {
      name: "Two Wheeler",

      recommendation: "Recommended for Documents, Lunchbox etc.",
      base_fare: 100,
      per_km: 25,
    },
    {
      name: "Three Wheeler",

      recommendation:
        "Recommended for Large items like small Furniture, appliances etc.",
      base_fare: 100,
      per_km: 25,
    },
    {
      name: "Mini truck",

      recommendation:
        "Recommended for Large items like small Furniture, appliances etc.",
      base_fare: 100,
      per_km: 25,
    },
  ]);
})();
export default Vehicle;
