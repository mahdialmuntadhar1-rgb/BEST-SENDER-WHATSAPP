import { Router } from 'express';
import multer from 'multer';
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  deleteContactsBulk,
  getGovernorateCounts,
  importContactsCSV,
} from '../controllers/contact.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.get('/', requireAuth, getContacts);
router.post('/', requireAuth, createContact);
router.put('/:id', requireAuth, updateContact);
router.delete('/:id', requireAuth, deleteContact);
router.delete('/bulk', requireAuth, deleteContactsBulk);
router.get('/governorates/counts', requireAuth, getGovernorateCounts);
router.post('/import', requireAuth, upload.single('file'), importContactsCSV);

export default router;
