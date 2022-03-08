const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
//crypto is build in node-js module that's why no need to install it.
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "A user must have a name"],
    minlength: [4, "A user name must be at least 4 characters"],
    maxlength: [20, "A user name must be at most 20 characters"],
    unique: [true, "A user name must be unique"],
  },
  email: {
    type: String,
    trim: true,
    required: [true, "Please provide your email address"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  password: {
    type: String,
    required: [true, "Please provide your password"],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["admin", "user", "guide", "lead-guide"],
    default: "user",
  },
  passwordChangedAt: Date,
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //this is only works on CREATE and SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords aren't the same",
    },
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});
userSchema.pre("save", async function (next) {
  //only run this if password was actually modified
  if (!this.isModified("password")) return next();
  //hash the password with cost 12
  this.password = await bcrypt.hash(this.password, 12);
  //Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000; //sometimes token created before password changed so to fix that bug, we substract by 1 second
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
//her icinde find gecen method calistignda once bu method calisr arkasindan ise find!, post ise hemen sonrasında
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  //active:false olmayanları goster!
  next();
});
userSchema.methods.changesPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  //FALSE means not changed
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
