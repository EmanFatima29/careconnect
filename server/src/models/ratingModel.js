import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    ratedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    raterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    ratedUserRole: {
      type: String,
      enum: ["doctor", "pharmacy"],
      required: true,
    },
  },
  { timestamps: true },
);

// One rating per rater–ratee pair
ratingSchema.index({ ratedUserId: 1, raterUserId: 1 }, { unique: true });

export default mongoose.model("Rating", ratingSchema);
