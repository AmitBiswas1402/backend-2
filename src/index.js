// require('dotenv').config({path: '/env'})
import dotenv from 'dotenv'
import connectDB from "./db/index.js";

dotenv.config({
    paths: './env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MongoDB connection failed !!!");
})











// import express from 'express'
// const app = express()

// ( async() =>{
//     try {
//         mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         application.on("error", (error) => {
//             console.log("ERR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("ERROR: ", error);
//         throw err 
//     }
// })()