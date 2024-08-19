import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    // TODO: get all videos based on query, sort, pagination

    const pipeline = [] // an empty array to push all searched videos


    if (query) { // query is search 
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"] // search with title and desc
                }
            }
        })
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user id")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    // fetch videos only that are published
    pipeline.push({ $match: {isPublished: true} }) 

    // sortBy can be by views, date...
    // sortType can be ascending or descending
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        })
    } else {
        pipeline.push({ $sort: {createdAt: -1} }) // default sort by oldest creation date
    }

    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline:[
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    )

    const videoAggregate = Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    const video = await Video.aggregatePaginate(videoAggregate, options);
    
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos fetched sucessfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    
    if ([title, description].some((field) => field?.trim() === "")) { // title and desc are mandatory 
        throw new ApiError(400, "All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "video file path is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file path is required")
    }

    // cloudinary uploads
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile) {
        throw new ApiError(400, "Video file not found")
    }

    if(!thumbnail) {
        throw new ApiError(400, "Thumbnail not found")
    }

    // create video entry in db
    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: {
            url: videoFile.url,
            public_id: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.url,
            public_id: thumbnail.public_id
        },
        owner: req.user?._id,
        isPublished: false        
    })

    // verifying the video by id
    const videoUploaded = await Video.findById(video._id);

    if (!videoUploaded) {
        throw new ApiError(500, "videoUpload failed please try again !!!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
})

export {
    getAllVideos,
    publishAVideo,
}