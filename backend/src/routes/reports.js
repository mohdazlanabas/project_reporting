const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const auth = require('../middleware/auth');
const { upload } = require('../utils/storage');

const router = express.Router();

router.post(
  '/',
  auth,
  upload.array('photos', 5),
  [
    body('siteName').notEmpty().withMessage('siteName is required'),
    body('reportDate').isISO8601().withMessage('reportDate must be ISO8601 date'),
    body('tonnage').optional().isFloat({ min: 0 }),
    body('status').optional().isLength({ max: 120 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { siteName, reportDate, weather, tonnage, coverMaterial, status, notes } = req.body;
    const tonnageValue = tonnage ? parseFloat(tonnage) : null;

    let extras = {};
    if (req.body.extras) {
      try {
        extras = typeof req.body.extras === 'string' ? JSON.parse(req.body.extras) : req.body.extras;
      } catch (err) {
        return res.status(400).json({ message: 'extras must be valid JSON' });
      }
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const insertReport = await client.query(
        `INSERT INTO reports (
          site_name, report_date, weather, tonnage, cover_material, status, notes, created_by, data
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING id, site_name, report_date, weather, tonnage, cover_material, status, notes, data, created_by, created_at`,
        [
          siteName,
          reportDate,
          weather || null,
          tonnageValue,
          coverMaterial || null,
          status || null,
          notes || null,
          req.user?.id || null,
          extras || {},
        ]
      );

      const report = insertReport.rows[0];
      const attachments = [];
      if (req.files && req.files.length) {
        for (const file of req.files) {
          const insertMedia = await client.query(
            'INSERT INTO report_media (report_id, filename, mime_type, path) VALUES ($1,$2,$3,$4) RETURNING id, filename, mime_type, path, uploaded_at',
            [report.id, file.filename, file.mimetype, file.path]
          );
          attachments.push(insertMedia.rows[0]);
        }
      }

      await client.query('COMMIT');

      return res.status(201).json({
        report,
        attachments,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Create report failed', err);
      return res.status(500).json({ message: 'Unable to save report' });
    } finally {
      client.release();
    }
  }
);

router.get('/', auth, async (req, res) => {
  const { siteName, dateFrom, dateTo } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const offset = parseInt(req.query.offset, 10) || 0;

  const filters = [];
  const params = [];
  if (siteName) {
    params.push(`%${siteName}%`);
    filters.push(`r.site_name ILIKE $${params.length}`);
  }
  if (dateFrom) {
    params.push(dateFrom);
    filters.push(`r.report_date >= $${params.length}`);
  }
  if (dateTo) {
    params.push(dateTo);
    filters.push(`r.report_date <= $${params.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  params.push(limit);
  params.push(offset);

  try {
    const query = `
      SELECT r.id, r.site_name, r.report_date, r.status, r.tonnage, r.weather, r.created_at,
             u.email AS created_by_email
      FROM reports r
      LEFT JOIN users u ON r.created_by = u.id
      ${whereClause}
      ORDER BY r.report_date DESC, r.id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(query, params);
    return res.json({ items: result.rows, limit, offset });
  } catch (err) {
    console.error('List reports failed', err);
    return res.status(500).json({ message: 'Unable to fetch reports' });
  }
});

router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const reportRes = await db.query(
      `SELECT r.*, u.email AS created_by_email
       FROM reports r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (!reportRes.rowCount) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const attachmentsRes = await db.query(
      'SELECT id, filename, mime_type, path, uploaded_at FROM report_media WHERE report_id = $1 ORDER BY uploaded_at ASC',
      [id]
    );

    return res.json({ report: reportRes.rows[0], attachments: attachmentsRes.rows });
  } catch (err) {
    console.error('Get report failed', err);
    return res.status(500).json({ message: 'Unable to fetch report' });
  }
});

module.exports = router;
