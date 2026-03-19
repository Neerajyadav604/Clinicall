const cloudinary = require('cloudinary').v2

const uploadBufferToCloudinary = (buffer, options) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        });

        stream.end(buffer);
    });


exports.uploadImageToCloudinary  = async (file, folder, height, quality) => {
    const options = {folder};
    if(height) {
        options.height = height;
    }
    if(quality) {
        options.quality = quality;
    }
    options.resource_type = "auto";

    if (file?.tempFilePath) {
    return await cloudinary.uploader.upload(file.tempFilePath, options);
    }

    if (file?.buffer) {
        return await uploadBufferToCloudinary(file.buffer, options);
    }

    throw new Error("No valid image file provided for upload");
}

// Upload raw document files (PDFs, DOCs, etc.) with resource_type: 'raw'
exports.uploadDocumentToCloudinary = async (file, folder) => {
    const options = {
        folder,
        resource_type: 'raw'
    };
    if (file?.tempFilePath) {
    return await cloudinary.uploader.upload(file.tempFilePath, options);
    }
    if (file?.buffer) {
        return await uploadBufferToCloudinary(file.buffer, options);
    }
    throw new Error("No valid document file provided for upload");
}

// Unified upload helper for mixed file types (images + documents)
exports.uploadFile = async (file, folder = "clinicall") => {
    if (!file) {
        throw new Error("No file provided for upload");
    }
    const mime = file.mimetype || "";
    if (mime.startsWith("image/")) {
        return await exports.uploadImageToCloudinary(file, folder);
    }
    return await exports.uploadDocumentToCloudinary(file, folder);
};
