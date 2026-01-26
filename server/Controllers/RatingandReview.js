const RatingandReview = require("../models/RatingandReview");
const User = require("../models/User");

exports.createRatingandReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!rating || !review) {
      return res.status(400).json({
        success: false,
        message: "Rating and review are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const alreadyReviewed = await RatingandReview.findOne({ user: userId });

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review",
      });
    }

    const RatingandReview = await RatingandReview.create({
      user: userId,
      rating,
      review,
    });

    return res.status(201).json({
      success: true,
      message: "Rating and review created successfully",
      data: RatingandReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create rating and review",
      error: error.message,
    });
  }
};

exports.getAllRatingsAndReviews = async (req, res) => {
  try {
    const ratingsAndReviews = await RatingandReview.find()
      .populate({
        path: "user",
        select: "firstName lastName email image",
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Ratings and reviews fetched successfully",
      data: ratingsAndReviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ratings and reviews",
      error: error.message,
    });
  }
};

exports.getAverageRating = async (req, res) => {
  try {
    const result = await RatingandReview.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No ratings available",
        data: {
          averageRating: 0,
          totalReviews: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Average rating calculated successfully",
      data: {
        averageRating: result[0].averageRating.toFixed(2),
        totalReviews: result[0].totalReviews,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to calculate average rating",
      error: error.message,
    });
  }
};

exports.getUserRatingandReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const RatingandReview = await RatingandReview.findOne({ user: userId })
      .populate({
        path: "user",
        select: "firstName lastName email image",
      });

    if (!RatingandReview) {
      return res.status(404).json({
        success: false,
        message: "No review found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User rating and review fetched successfully",
      data: RatingandReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user rating and review",
      error: error.message,
    });
  }
};

exports.updateRatingandReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const userId = req.user.id;

    if (!rating || !review) {
      return res.status(400).json({
        success: false,
        message: "Rating and review are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const RatingandReview = await RatingandReview.findOneAndUpdate(
      { user: userId },
      { rating, review },
      { new: true, runValidators: true }
    );

    if (!RatingandReview) {
      return res.status(404).json({
        success: false,
        message: "No review found to update",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rating and review updated successfully",
      data: RatingandReview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update rating and review",
      error: error.message,
    });
  }
};

exports.deleteRatingandReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const RatingandReview = await RatingandReview.findOneAndDelete({
      user: userId,
    });

    if (!RatingandReview) {
      return res.status(404).json({
        success: false,
        message: "No review found to delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rating and review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete rating and review",
      error: error.message,
    });
  }
};