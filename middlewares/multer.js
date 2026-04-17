import multer from 'multer';

const storage = multer.memoryStorage();

// 'file' naam se frontend se photo aayegi
export const singleUpload = multer({ storage }).single('file');