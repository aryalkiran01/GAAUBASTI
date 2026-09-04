import Report from '../models/Report.js';


const createReport = async (req, res) => {
  try {
    const { reportedEntityType, reportedEntityId, reason, description } = req.body;

    if (!reportedEntityType || !reportedEntityId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'reportedEntityType, reportedEntityId, and reason are required'
      });
    }

    if (!['listing', 'user', 'message'].includes(reportedEntityType)) {
      return res.status(400).json({
        success: false,
        message: 'reportedEntityType must be listing, user, or message'
      });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedEntityType,
      reportedEntityId,
      reason,
      description: description || '',
      status: 'open'
    });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: { report }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getReports = async (req, res) => {
  try {
    const { status, reportedEntityType, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter: Record<string, any> = {};

    if (status) filter.status = status;
    if (reportedEntityType) filter.reportedEntityType = reportedEntityType;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalReports: total
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['open', 'resolved', 'dismissed'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: open, resolved, dismissed'
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    await report.save();

    return res.json({
      success: true,
      message: 'Report status updated',
      data: { report }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { createReport, getReports, updateReportStatus };