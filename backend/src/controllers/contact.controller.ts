import { Request, Response } from 'express';
import { ContactModel, Governorate } from '../models/Contact';
import { detectLanguage, GOVERNORATES } from '../utils/language-detection';
import { normalizePhoneNumber, validatePhoneNumber } from '../utils/phone-normalization';
import { AuthRequest } from '../middleware/auth.middleware';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface CsvRow {
  name: string;
  phone: string;
  governorate?: string;
  language?: string;
}

export const getContacts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const governorates = req.query.governorate as string[];

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (governorates && governorates.length > 0) {
      query.governorate = { $in: governorates };
    }

    const skip = (page - 1) * limit;

    const [contacts, total] = await Promise.all([
      ContactModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ContactModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, phone, governorate, language, tags } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone are required' });
      return;
    }

    if (!validatePhoneNumber(phone)) {
      res.status(400).json({ error: 'Invalid phone number format' });
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const detectedLanguage = language || (governorate ? detectLanguage(governorate as Governorate) : 'arabic');

    const contact = await ContactModel.create({
      name,
      phone: normalizedPhone,
      governorate,
      language: detectedLanguage,
      tags: tags || [],
    });

    res.status(201).json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error('Create contact error:', error);
    if (error.code === 11000) {
      res.status(409).json({ error: 'Contact with this phone and governorate already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const updateContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, governorate, language, tags } = req.body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) {
      if (!validatePhoneNumber(phone)) {
        res.status(400).json({ error: 'Invalid phone number format' });
        return;
      }
      updateData.phone = normalizePhoneNumber(phone);
    }
    if (governorate) updateData.governorate = governorate;
    if (language) updateData.language = language;
    if (tags) updateData.tags = tags;

    const contact = await ContactModel.findByIdAndUpdate(id, updateData, { new: true });

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({
      success: true,
      contact,
    });
  } catch (error: any) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteContact = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await ContactModel.findByIdAndDelete(id);

    if (!contact) {
      res.status(404).json({ error: 'Contact not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteContactsBulk = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Contact IDs are required' });
      return;
    }

    const result = await ContactModel.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      deleted: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Bulk delete contacts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGovernorateCounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const counts = await ContactModel.aggregate([
      {
        $group: {
          _id: '$governorate',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const result = GOVERNORATES.map((gov) => ({
      governorate: gov,
      count: counts.find((c) => c._id === gov)?.count || 0,
    }));

    res.json({
      success: true,
      counts: result,
    });
  } catch (error: any) {
    console.error('Get governorate counts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const importContactsCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { duplicateHandling = 'skip' } = req.body;
    const file = req.file;

    // Set up SSE for progress updates
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const readable = new Readable();
    readable.push(file.buffer);
    readable.push(null);

    const rows: CsvRow[] = [];
    let totalRows = 0;
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;

    readable
      .pipe(csv())
      .on('data', (row: CsvRow) => {
        rows.push(row);
        totalRows++;
      })
      .on('end', async () => {
        sendEvent('progress', { processed: 0, total: totalRows });

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];

          try {
            if (!row.name || !row.phone) {
              errors++;
              sendEvent('error', { row: i + 1, message: 'Missing name or phone' });
              continue;
            }

            if (!validatePhoneNumber(row.phone)) {
              errors++;
              sendEvent('error', { row: i + 1, message: 'Invalid phone number' });
              continue;
            }

            const normalizedPhone = normalizePhoneNumber(row.phone);
            const governorate = row.governorate as Governorate;
            const language = row.language || (governorate ? detectLanguage(governorate) : 'arabic');

            const existingContact = await ContactModel.findOne({
              phone: normalizedPhone,
              governorate,
            });

            if (existingContact) {
              if (duplicateHandling === 'overwrite') {
                await ContactModel.updateOne(
                  { _id: existingContact._id },
                  {
                    name: row.name,
                    phone: normalizedPhone,
                    governorate,
                    language,
                  }
                );
                inserted++;
              } else {
                duplicates++;
              }
            } else {
              await ContactModel.create({
                name: row.name,
                phone: normalizedPhone,
                governorate,
                language,
              });
              inserted++;
            }

            sendEvent('progress', {
              processed: i + 1,
              total: totalRows,
              inserted,
              duplicates,
              errors,
            });
          } catch (error: any) {
            errors++;
            sendEvent('error', { row: i + 1, message: error.message });
          }
        }

        sendEvent('complete', {
          total: totalRows,
          inserted,
          duplicates,
          errors,
        });

        res.end();
      })
      .on('error', (error) => {
        console.error('CSV parsing error:', error);
        sendEvent('error', { message: 'CSV parsing failed' });
        res.end();
      });
  } catch (error: any) {
    console.error('Import contacts error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
