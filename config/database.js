// creating the data base 

const mongoose = require("mongoose")

// require("dotenv").config();

const databaseConnection = ()=>{
    mongoose.connect("mongodb://localhost:27017/udemy",{

        })
    .then(()=>{
        console.log("Data base is connected")
    })
    .catch((error)=>{
        console.log("Some error occur")
        console.log(error)
    })
}

module.exports = databaseConnection();