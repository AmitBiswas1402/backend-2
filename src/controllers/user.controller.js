import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploaOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async(req, res) => {
    // get user details - frontend
    // validations
    // check if user is existing - username & email
    // check for images / avatar
    // upload to cloudinary
    // create user object - entry in db
    // remove passwords and refresh token fields
    // check for user creation
    // return res

    // get user details - frontend
    const {fullName, email, username, password} = req.body
    // console.log("email: ", email);

    // validations
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check if user is existing - username & email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    // console.log(req.files);    

    // check for images / avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.file?.coverImage[0]?.path

    // let coverImageLocalPath
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload to cloudinary
    const avatar = await uploaOnCloudinary(avatarLocalPath)
    const coverImage = await uploaOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove passwords and refresh token fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Spmething went wrong registering the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
    
})

export {
    registerUser
}