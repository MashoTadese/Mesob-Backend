// ============================================================
// MESOB - Service Requirement Controller
// Trilingual: EN / AM / OR — one document per service
// ============================================================
const ServiceRequirement = require('../models/ServiceRequirement');

// Extract window number for sorting
function getWindowOrder(windowStr) {
  if (!windowStr) return 99;
  const m = windowStr.match(/Window\s*(\d+)/i) || windowStr.match(/(\d+)/);
  return m ? parseInt(m[1]) : 99;
}

// @desc  Get all requirements (PUBLIC) — sorted by window
// @route GET /api/requirements
exports.getAll = async (req, res, next) => {
  try {
    const items = await ServiceRequirement.find().sort({ windowOrder: 1, serviceName: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
};

// @desc  Get one requirement by service name (PUBLIC)
// @route GET /api/requirements/:serviceName
exports.getOne = async (req, res, next) => {
  try {
    const name = decodeURIComponent(req.params.serviceName);
    let item = await ServiceRequirement.findOne({ serviceName: name });
    if (!item) {
      const all = await ServiceRequirement.find();
      item = all.find((r) =>
        name.toLowerCase().includes(r.serviceName.toLowerCase()) ||
        r.serviceName.toLowerCase().includes(name.toLowerCase())
      ) || null;
    }
    if (!item) return res.json({ success: true, data: null });
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
};

// @desc  Create requirement (ADMIN)
// @route POST /api/requirements
exports.create = async (req, res, next) => {
  try {
    const { serviceName, window, windowOrder,
      requirementsEN, requirementsAM, requirementsOR,
      processingTimeEN, processingTimeAM, processingTimeOR,
      feeEN, feeAM, feeOR,
      stepsEN, stepsAM, stepsOR,
      // legacy fallback fields
      requirements, processingTime, fee, steps,
    } = req.body;

    if (!serviceName) return res.status(400).json({ success: false, message: 'serviceName is required.' });

    const item = await ServiceRequirement.create({
      serviceName,
      window,
      windowOrder: windowOrder || getWindowOrder(window),
      requirementsEN:   requirementsEN   || requirements || [],
      requirementsAM:   requirementsAM   || [],
      requirementsOR:   requirementsOR   || [],
      processingTimeEN: processingTimeEN || processingTime || '',
      processingTimeAM: processingTimeAM || '',
      processingTimeOR: processingTimeOR || '',
      feeEN:            feeEN  || fee  || '',
      feeAM:            feeAM  || '',
      feeOR:            feeOR  || '',
      stepsEN:          stepsEN || steps || [],
      stepsAM:          stepsAM || [],
      stepsOR:          stepsOR || [],
    });
    res.status(201).json({ success: true, message: 'Requirement created.', data: item });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: 'A requirement for this service already exists.' });
    next(err);
  }
};

// @desc  Update requirement (ADMIN)
// @route PUT /api/requirements/:id
exports.update = async (req, res, next) => {
  try {
    const { serviceName, window,
      requirementsEN, requirementsAM, requirementsOR,
      processingTimeEN, processingTimeAM, processingTimeOR,
      feeEN, feeAM, feeOR,
      stepsEN, stepsAM, stepsOR,
    } = req.body;

    const item = await ServiceRequirement.findByIdAndUpdate(
      req.params.id,
      {
        serviceName, window,
        windowOrder: getWindowOrder(window),
        requirementsEN, requirementsAM, requirementsOR,
        processingTimeEN, processingTimeAM, processingTimeOR,
        feeEN, feeAM, feeOR,
        stepsEN, stepsAM, stepsOR,
      },
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Requirement not found.' });
    res.json({ success: true, message: 'Requirement updated.', data: item });
  } catch (err) { next(err); }
};

// @desc  Delete requirement (ADMIN)
// @route DELETE /api/requirements/:id
exports.remove = async (req, res, next) => {
  try {
    const item = await ServiceRequirement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Requirement not found.' });
    res.json({ success: true, message: 'Requirement deleted.' });
  } catch (err) { next(err); }
};

// @desc  Seed all requirements (ADMIN) — upsert
// @route POST /api/requirements/seed
exports.seed = async (req, res, next) => {
  try {
    const { requirements } = req.body;
    if (!Array.isArray(requirements) || !requirements.length) {
      return res.status(400).json({ success: false, message: 'requirements array required.' });
    }
    let inserted = 0, updated = 0;
    for (const r of requirements) {
      const payload = { ...r, windowOrder: getWindowOrder(r.window) };
      const existing = await ServiceRequirement.findOne({ serviceName: r.serviceName });
      if (existing) {
        await ServiceRequirement.findByIdAndUpdate(existing._id, payload);
        updated++;
      } else {
        await ServiceRequirement.create(payload);
        inserted++;
      }
    }
    res.json({ success: true, message: `Seeded: ${inserted} inserted, ${updated} updated.`, inserted, updated });
  } catch (err) { next(err); }
};
