import multer, { FileFilterCallback, Multer } from 'multer';
import { Request } from 'express';
import path from 'path';

export const uploaderMulter = (acceptedFiles: string[]) => {
  const storage = multer.diskStorage({
    destination: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) {
      const mainDirectory = path.join(process.cwd()); 
      cb(null, `${mainDirectory}/src/uploads/images`);
    },
    filename: function (
      req: Request,
      file: Express.Multer.File,
      cb: (error: Error | null, destination: string) => void
    ) {
        const fileFormat = file.originalname?.split('.').slice(-1)[0]
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9); 
      cb(null, `${file.fieldname}-${uniqueSuffix}.${fileFormat}`); 
    },
  });

  function fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) {
    const fileFormat = file.originalname?.split('.').slice(-1)[0];
    if (!acceptedFiles.includes(fileFormat)){
        cb(new Error('File type is not accepted'));
    }
    cb(null, true);
  }

  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, 
  });
};