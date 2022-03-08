//uncaughtException en basta olmali
process.on("uncaughtException", (err) => {
  /*   console.log(
    "UNCAUGHT EXCEPTION- Shooting down...",
    err.name,
    err.message,
    err.stack
  ); */
  process.exit(1);
});
const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" }); //apptan önce olmalı, çünkü appta congif kullanılmış!
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose //.connect(process.env.DATABASE_LOCAL,{
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then((con) => {
    // console.log("connection:",con.connections);
    /*     console.log("DB connection successful!");
     */
  });
//test: burada bug var
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  /*   console.log(`App running on port:${port}...`);
   */
});

process.on("unhandledRejection", (err) => {
  /*   console.log("UNHANDLED REJECTION-", err.name, err.message);
   */ server.close(() => process.exit(1));
});

/*
const toursSchema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"A tour must have a name"],
        unique:[true,"A tour name must be unique!"]
    },
    rating:{
        type:Number,
        required:true,
        default:4.5
    },
    price:{
        type:Number,
        required:[true,"A tour must have a price"]
    }
});

const Tour= mongoose.model('Tour',toursSchema);

const testTour=new Tour({
    name:"The Park Camper",
    rating:8.3,
    price:295
});

 Create işlemi
 testTour.save()
.then(doc=>{
    console.log("Kaydedilen:",doc);
})
.catch(err=>{
    console.log(err);
})
; */

//console.log(process.env);/* proje hakkında birçok bilgiyi listeler */
//console.log(app.get('env'));/*environment develpoment yazar,npm run start:prod ile çalıştırıldğında production çalışır */

/* config dosyasını okuyup node environmente ekledi! 
-config dosyası oluşturduk
-npm i dotenv ile dotenv kurduk 
*/
