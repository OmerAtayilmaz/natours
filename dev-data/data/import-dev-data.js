const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./../../models/tourModel");
const Review = require("./../../models/reviewModel");
const User = require("./../../models/userModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, {
  useNewUrlParser: true,
});
//READ JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/./tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/./users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/./reviews.json`, "utf-8")
);
//Import data into database
const importData = async () => {
  try {
    //  await Tour.create(tours);
    // await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    process.exit();
  } catch (err) {
    /*     console.log(err);
     */
  }
};

//DELETE ALL DATA FROM COLLECTİON
const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    await Review.deleteMany();
    //   await User.deleteMany();
    process.exit(); /* işlemi bitir.  */
  } catch (err) {
    /*     console.log(err);
     */
  }
};
//command line:node dev-data/data/import-dev-data.js --import
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}
/* console.log(process.argv);
 */
