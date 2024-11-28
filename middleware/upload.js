const multer = require('multer');
const path = require('path');

// CSV 파일용 메모리 스토리지 설정
const csvStorage = multer.memoryStorage();

// 이미지 파일용 디스크 스토리지 설정
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터 설정
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'file' && (
    file.mimetype === 'text/csv' || 
    file.originalname.toLowerCase().endsWith('.csv')
  )) {
    cb(null, true);
  } 
  else if (file.fieldname === 'profileImage' && 
    file.mimetype.startsWith('image/')
  ) {
    cb(null, true);
  }
  else {
    cb(new Error('지원하지 않는 파일 형식입니다'));
  }
};

// CSV 업로드용 multer 설정
const csvUpload = multer({
  storage: csvStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 이미지 업로드용 multer 설정
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = {
  csvUpload,
  imageUpload
}; 