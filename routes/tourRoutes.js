const express = require("express");
const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  resizeTourImages,
  uploadTourImages,
} = require("../controllers/tourController");
const authController = require("./../controllers/authController");
//const reviewController = require("./../controllers/reviewController");
const reviewRouter = require("./../routes/reviewRoutes");

const router = express.Router();
//Create a checkbody middleware
//Check if body contains the name and price property
//If not, send back 400 (bad request)
//Add it to the post handler stack

/* router.param('id',(req,res,next,val)=>{
 console.log(`Tour id is ${val}`);id'yi verdi 
 next();
}); */

router.route("/top-5-cheap").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(getTourStats);
router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    getMonthlyPlan
  );
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);
//tours-distanc?distance=233&center=-40,45,unit=mi
//tours-distance/233/center/-40,45/unit/mi

router.route("/distances/:latlng/unit/:unit").get(getDistances);
router
  .route("/")
  .get(getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    createTour
  );

router
  .route("/:id")
  .get(getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    deleteTour
  );
//POST/tour/1234/reviews
//GET /tour/1234/reviews
//GET /tour/1231/reviews/asdsadsa

/*saglıklı bir kullanım degil!!!!!!!! çünkü tourRoutes icinde reviewController degil sadece tourController kullanılmalıdır! 
 router
    .route("/:tourId/reviews")
    .post(
      authController.protect,
      authController.restrictTo("user"),
      reviewController.createReview
    ); */
router.use("/:tourId/reviews", reviewRouter);
module.exports = router;
