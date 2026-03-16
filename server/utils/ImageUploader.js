const cloudinary = require('cloudinary').v2


exports.uploadImageToCloudinary  = async (file, folder, height, quality) => {
    const options = {folder};
    if(height) {
        options.height = height;
    }
    if(quality) {
        options.quality = quality;
    }
    options.resource_type = "auto";

    return await cloudinary.uploader.upload(file.tempFilePath, options);
}

// Upload raw document files (PDFs, DOCs, etc.) with resource_type: 'raw'
exports.uploadDocumentToCloudinary = async (file, folder) => {
    const options = {
        folder,
        resource_type: 'raw'
    };
    return await cloudinary.uploader.upload(file.tempFilePath, options);
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
