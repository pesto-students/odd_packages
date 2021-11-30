import multer from "multer";
import AWS from "aws-sdk";
import multerS3 from "multer-s3";

var accessKeyId = "AKIARZJEKPRNJY7IFLFB";
var secretAccessKey = "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";

AWS.config.update({
  secretAccessKey: secretAccessKey,
  accessKeyId: accessKeyId,
  region: "ap-south-1",
});

var s3 = new AWS.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "odd-pestp",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      console.log(file);
      cb(null, file.originalname); //use Date.now() for unique file keys
    },
  }),
});

export default upload;
