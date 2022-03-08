const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
//token oluşturma fonksiyonu
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

//olusturulan tokeni gondermek
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  // secure: true,sadece https'de gonderilir.
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers("x-forwarded-proto") === "https",
  });

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get("host")}/me`;
  /*   console.log(url);
   */ await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, req, res);
});
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //if email-password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  //check if user exist && password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401)); //401 means unauthorized
  }
  //if everthing is ok, send token to client
  createSendToken(user, 200, req, res);
});
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and checking if it's exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    //console.log(token);
    return next(
      new AppError("You are not logged in! Please login to get access", 401)
    );
  }
  // 2) Verification token
  //promisify kullanımı! çok önemli!
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(
      new AppError("The user belonging to this token does no longer exist", 401)
    );
  }
  // 4) Check if user change password after the JWT was issued
  if (currentUser.changesPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
//Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and checking if it's exist
  if (req.cookies.jwt) {
    try {
      // 2) Verification token
      //promisify kullanımı! çok önemli!
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // 3) Check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        next();
      }
      // 4) Check if user change password after the JWT was issued
      if (currentUser.changesPasswordAfter(decoded.iat)) {
        return next();
      }
      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    //if no problem
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    /*     console.log(err);
     */ return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, req, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //2) check if the current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError(`The current password is incorrect!`, 401));
  //3) if so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //pre hook burada calisicak .)) pre 'save'
  await user.save();

  //4) log user in, send JWT
  createSendToken(user, 200, req, res);
});
