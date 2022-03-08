const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression = require("compression");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");

//GLOBAL MIDDLEWARES
const app = express();

app.enable("trust proxy");
//defining view engine
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views")); //views adındaki klasörün yolunu getirir.

//serving static files
app.use(express.static(path.join(__dirname, "public")));
//Set Security HTTP headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);
//Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour!",
});
//sadece icide /api gecenlerde calisir. :)
app.use("/api", limiter);
//body parser,reading data from the body into req.body
app.use(
  express.json({
    limit: "10kb", //10kb gecen veri kabul edilmez
  })
);
//post requestten dala almak icin kullandık, yoksa bos obje donuyor
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);
app.use(cookieParser());
//Data sanitization against NoSQL query injection
app.use(mongoSanitize()); //req.body,req.params etc. gibi yerlere bakar ve $ işareti gibi injecion yapılabilecek data var mı kontrol eder.
//Data sanitization against XSS
app.use(xss());
//clean any malicious html code
//"&lt;h4>name&lt;/h4>", html taglarini buna cevirdi

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "maxGroupSize",
      "ratingsAverage",
      "ratingsQuantity",
      "difficulty",
      "price",
    ],
  })
);
//or:{{URL}}api/v1/tours?sort=duration&sort=price hem duration hem de price gore sıralamaz en sondakini alır- yazmasak error verir-

app.use(compression());
//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //(req.cookies);
  next();
});
//serving static filesçc
//app.use(express.static(`${__dirname}/public`));

app.use("/", viewRouter);
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);
module.exports = app;
