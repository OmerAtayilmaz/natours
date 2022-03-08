const mongoose = require("mongoose");
const slugify = require("slugify");
//for embedding=> const User = require("./userModel");
const validator = require("validator");
const toursSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: [true, "A tour name must be unique!"],
      trim: true,
      maxlength: [25, "A tour name must be less than 25 characters"],
      minlength: [5, "A tour name must be greather than 2 characters"],
      /*   validate: [
        validator.isAlpha,
        "A name  must only contains alpha characters",
      ], //TPL kullanarak yaptik
      */
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have difficulty"],
      enum: {
        //enum stadece stringler için calisir, numaralarda degil!
        values: ["easy", "medium", "difficult"],
        message: "Difficulty eaither easy,medium or difficult",
      }, //alabileceği degerler
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //min-max numara ve date için çalişir.
      min: [1, "A tour ratings average must be above 1"],
      max: [5, "A tour ratings average must be below 5"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //this sadece create işlemlerinde var!! bu yüzden this kullanacaksan sadece yeni obje olusturdugunda calisir, update gibi işlemlerde çalışmaz
        validator: function (value) {
          return value < this.price;
        }, //valueyi yazdırır
        message: "price discount ({VALUE}) must be between less than price ",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true /* trim only work for trim=>remove all the white space from the begining and in end of the string */,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a cover image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //db'de get ile cagirdigimizda gelmez.
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: { type: String, default: "Point", enum: ["Point"] },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    /* for embedding=> guides: Array, */
    guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }], //new type!,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
toursSchema.index({ price: 1 });
toursSchema.index({ ratingsAverage: 1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: "2dsphere" }); //1-ascending order,-1 descending order

//normalde db'ye dahil olmayan bir veri oluşturur ve kullanmamızı sağlar. Fakat db'den gelen veri değildir.
toursSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});
//Virtual Populate *** IMPORTANCE ***
toursSchema.virtual("reviews", {
  ref: "Reviews",
  foreignField: "tour", //aranan modeldeki bu modelin adı ***
  localField: "_id",
});
//important: we can use multiple pre,post etc. middleware for same hook
//DOCUMENT MIDDLEWARE: runs before .save() and .create() command - not insertMany
toursSchema.pre("save", function (next) {
  /*   console.log(this); //işlem gören objeyi döndürür.
   */ this.slug = slugify(this.name, { lower: true });
  next();
  /*
   
    1-this.slug adında bir virtual obje oluştu
    2-slugify ile objeyi alıp özelleştirip return işlemi uyguladık
    3-virtal object created
    4-middleware olduğu için next dedik
    slugify.extend({'☢':'radioactive'}),
    slugify options: replacement,remove,lower,strict, locale, trim dahası için "npmjs"
    */
});
/*  bu embedding icin calisir, id'ye gore veri getirip tura yazdırdık
toursSchema.pre("save", async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id)); //result "promise"s
  this.guides = await Promise.all(guidesPromises);
  next();
});
 */
//Query middleware
toursSchema.pre(/^find/, function (next) {
  //regex(regular expressions) kullandık, içinde find geçiyorsa bu pre hooksu uygula dedik.
  //this is a query objec in query middleware
  this.find({ secretTour: { $ne: true } }); // if secretTour is not equal to true
  this.start = Date.now();
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt", //bu 2 veriyi gostermez
  });
  next();
});
//post middleware: has two parameters. doc:the document which we try to save, next() for continuing
toursSchema.post("save", function (doc, next) {
  /*   console.log(doc);
   */ next();
});

toursSchema.post(/^find/, function (docs, next) {
  /*   console.log(`Query took ${Date.now() - this.start} miliseconds`);
   */ //console.log(docs);
  next();
});

//pipeline sayesinde gorunmesını istemedigimiz tur icin siralama sartini tourControllerdan alıp kullandık. - orada aggregate deyip oluşturduk burda pre hook ile erişip kullandık -

const Tour = mongoose.model("Tour", toursSchema);

module.exports = Tour;
