import mongoose from "mongoose";

const driver = new mongoose.Schema({
    total_distance_travel: {
        type: Number,
        default: 0
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
    },
    total_earning: {
        type: Number,
        default: 0
    },
    total_online_time: {
        type: Number,
        default: 0
    },
    number_of_trips: {
        type: Number,
        default: 0
    }
});


const DriverStatics = mongoose.model("DriverStats", driver);

export default DriverStatics;