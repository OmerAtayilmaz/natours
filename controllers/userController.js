const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    //cb:callback
    cb(null, "public/img/users"); //first arg "error", if not just use null, arg2: destination
  },
  filename: (req, file, cb) => {
    //user-asd21easd-timestamp.jpeg format bu olacak
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
}); */
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image please upload only images!", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
exports.uploadUserPhoto = upload.single("photo");
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500) //boyut
    .toFormat("jpeg") //donusturulecek format
    .jpeg({ quality: 90 }) //kalite yuzdesi
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});
exports.updateMe = catchAsync(async (req, res, next) => {
  /*   console.log(req.file);
  console.log(req.body); */
  //1) create error if user POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        `This route is not for password updates, please use /updateMyPassword`,
        400
      )
    ); //400: bad request
  }
  //2) filtered out uwanted fields
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename;
  //eger body'i filtrelemezsek kullanıcı herşeyi güncelleyebilir! role='admin'
  //3)updated
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  /* update'de .save() kullanırsak hata verir: await user.save();
    sebebiyse dokuman sıfırdan kaydedildigi icin tekrardan validationlar calısır ve hepsi zorunlu hale gelir, yani sadece "name" gibi bir propertyi güncelleyemeyiz.
  */
  res.status(200).json({ status: "success", data: { user: updatedUser } });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({ status: "success", data: null });
});
exports.createUser = (req, res) => {
  res
    .status(500)
    .json({ status: "error", message: "Please use /signup instead " });
};
//giriş yapan kullanıcı kendi bilgisine ulasir.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
//do not update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
