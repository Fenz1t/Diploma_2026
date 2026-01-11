const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Создаем папку если её нет
const uploadDir = path.join(__dirname, "../uploads/employees");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Настройка хранилища
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    let filename;

    if (req.params && req.params.id) {
      filename = `employee-${req.params.id}-${uniqueSuffix}${ext}`;
    } else {
      filename = `employee-${uniqueSuffix}${ext}`;
    }

    cb(null, filename);
  },
});

// Фильтр файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Только изображения (jpeg, jpg, png, gif)"));
  }
};

// Создаем экземпляр multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Middleware для загрузки одного файла
const uploadEmployeePhoto = upload.single("photo");

// Middleware для обработки ошибок
const handleUpload = (req, res, next) => {
  uploadEmployeePhoto(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "Файл слишком большой (макс. 5MB)",
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
    }
    next();
  });
};

// Удаление старого файла
const deleteOldPhoto = async (photoUrl) => {
  if (!photoUrl) return;

  try {
    const filename = path.basename(photoUrl);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Ошибка при удалении старого фото:", error);
  }
};

module.exports = {
  handleUpload,
  deleteOldPhoto,
  uploadDir,
};
