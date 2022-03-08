const multer = require("multer");
const sharp = require("sharp");

const Tour = require("../models/tourModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError.js");
const factory = require("./handlerFactory");

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image please upload only images!", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 3,
  },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  //1-) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) //boyut
    .toFormat("jpeg") //donusturulecek format
    .jpeg({ quality: 90 }) //kalite yuzdesi
    .toFile(`public/img/tours/${req.body.imageCover}`);
  //2-) Other images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333) //boyut
        .toFormat("jpeg") //donusturulecek format
        .jpeg({ quality: 90 }) //kalite yuzdesi
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  console.log(req.body);
  next();
});
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: "$difficulty" }, //büyük harf yapar ve id'ye göre gruplayıp aşağıdaki statsları bulur.
        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1, //1:ascending
      },
    },
    // ,
    // {
    //   $match: { _id: { $ne: 'EASY' } } //not equal to 'EASY', easy olanı dahil etmez.
    // }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year);
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates", //arraydaki her date için o date'nin baglı oldugu objeyi date ile dondurur.
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStars: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 }, //id no longer shows up
    },
    {
      $sort: { numTourStars: -1 },
    },
    {
      $limit: 6,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { plan },
  });
});
//tours-within/233/center/38.485719, -117.295317/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(
      new AppError(
        "please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: "success",
    data: { tours },
  });
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  const multiplier = unit === "mi" ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(
      new AppError(
        "please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        //geoNear always needs to be first stage
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier, //distance'nin bölünecegi sayı -optional-
      },
    },
    {
      $project: {
        distance: 1, //almak istedigimiz verilerin yarınına 1 yazdık
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: "success",
    data: distances,
  });
});
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
