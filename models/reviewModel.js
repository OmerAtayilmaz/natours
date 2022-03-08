const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be between 1 and 5"],
      max: [5, "Rating must be between 1 and 5"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour."],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
  },
  {
    toJSON: { virtuals: true }, //user ve tour'un gozukmesi icin bu toJSON ve toObject true olmalıdır!!
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  /*  this.populate({ //fakat chaining oluyor tour icinde review,review icinde user user icinde tour etc. gozukuyor bunun ıcın dozunda kullanmak gerekiyor!
    path: "tour", //user ve touru populate ettik.
    select: "name",
  }).populate({
    path: "user",
    select: "name photo",
  }); */
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //this keyword point to Model!
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRatings: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);
  //console.log(stats);
  //postta next olmaz!

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};
reviewSchema.post("save", async function (doc) {
  //this point to current review
  //asagidaki kodda amaç review oluştuğunda middleware'yi oluşturmaktır! Review.calcAverageRatings'de calısır fakat hata verir cünkü review daha tanımlanmadı! eger asagi goturursek bu sefer de middleware'yi dahil etmez
  this.constructor.calcAverageRatings(this.tour);
});

//findByIdAndUpdate
//findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //pre next alır,post almaz.
  this.r = await this.clone().findOne();
  // console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne() does not execute here, quary has already executed!
  await this.r.constructor.calcAverageRatings(this.r.tour);
});
const Review = mongoose.model("Reviews", reviewSchema);
module.exports = Review;
