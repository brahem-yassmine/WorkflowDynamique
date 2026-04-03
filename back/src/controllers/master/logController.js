const LogService = require('../../services/logService');

class LogController {
  constructor(connection) {
    this.logService = new LogService(connection);
  }

  // Fetch logs with filters
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        userEmail,
        userRole,
        actionType,
        entityType,
        entityId,
        status,
        tenantId,
        ipAddress,
        startDate,
        endDate,
        search
      } = req.query;

      const filters = {
        userId,
        userEmail,
        userRole,
        actionType,
        entityType,
        entityId,
        status,
        tenantId,
        ipAddress,
        startDate,
        endDate,
        search
      };

      // Clean empty filters
      Object.keys(filters).forEach(key =>
        filters[key] === undefined || filters[key] === '' ? delete filters[key] : {}
      );

      const result = await this.logService.getLogs(filters, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving logs',
        error: error.message
      });
    }
  }

  // Get specific log
  async getLogById(req, res) {
    try {
      const { id } = req.params;

      const Log = require('../models/master/Log')(req.app.locals.masterConnection);
      const log = await Log.findById(id).lean();

      if (!log) {
        return res.status(404).json({
          success: false,
          message: 'Log not found'
        });
      }

      res.json({
        success: true,
        data: log
      });
    } catch (error) {
      console.error('Error retrieving log:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving log',
        error: error.message
      });
    }
  }

  // Get log statistics
  async getLogStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const stats = await this.logService.getLogStats(startDate, endDate);

      res.json({
        success: true,
        data: stats[0] || {}
      });
    } catch (error) {
      console.error('Error retrieving statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving statistics',
        error: error.message
      });
    }
  }

  // Export logs (CSV)
  async exportLogs(req, res) {
    try {
      const filters = req.query;

      const result = await this.logService.getLogs(filters, 1, 10000); // Limit to 10000 logs for export

      // Convert to CSV
      const csv = this.convertToCSV(result.logs);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
      res.send(csv);
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error exporting logs',
        error: error.message
      });
    }
  }

  // Clean old logs
  async cleanOldLogs(req, res) {
    try {
      const { days = 90 } = req.body;

      const Log = require('../models/master/Log')(req.app.locals.masterConnection);
      const result = await Log.cleanOldLogs(days);

      // Log this action
      await this.logService.logCreate(
        req.user,
        'LOGS',
        { _id: 'cleanup', message: `Logs cleanup older than ${days} days` },
        req,
        { deletedCount: result.deletedCount, daysKept: days }
      );

      res.json({
        success: true,
        message: `${result.deletedCount} logs deleted`,
        data: { deletedCount: result.deletedCount }
      });
    } catch (error) {
      console.error('Error cleaning logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error cleaning logs',
        error: error.message
      });
    }
  }

  // Delete individual log
  async deleteLog(req, res) {
    try {
      const { id } = req.params;
      const result = await this.logService.deleteLog(id);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Log entry not found'
        });
      }

      res.json({
        success: true,
        message: 'Log deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting log',
        error: error.message
      });
    }
  }

  // Delete logs by category
  async deleteBulkLogs(req, res) {
    try {
      const { category, isSecurityView = false } = req.body;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required for bulk deletion'
        });
      }

      const result = await this.logService.deleteLogsByCategory(category, isSecurityView);

      // Log this purge action
      await this.logService.logCreate(
        req.user,
        'SECURITY_AUDIT',
        { _id: 'purge', message: `Bulk purge of ${category} logs` },
        req,
        { deletedCount: result.deletedCount, category, isSecurityView }
      );

      res.json({
        success: true,
        message: `${result.deletedCount} logs purged from ${category} category`,
        data: { deletedCount: result.deletedCount }
      });
    } catch (error) {
      console.error('Error purging logs:', error);
      res.status(500).json({
        success: false,
        message: 'Error purging logs',
        error: error.message
      });
    }
  }

  // Convert to CSV
  convertToCSV(logs) {
    if (!logs || logs.length === 0) return '';

    const headers = ['Date', 'User', 'Email', 'Role', 'Action', 'Entity', 'Description', 'IP', 'Status'];
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data
    for (const log of logs) {
      const row = [
        new Date(log.timestamp).toLocaleString(),
        log.userName || log.userEmail,
        log.userEmail,
        log.userRole === 'super_admin' ? 'Super Admin' : 'Admin Tenant',
        log.actionType,
        log.entityType,
        `"${log.description.replace(/"/g, '""')}"`,
        log.ipAddress,
        log.status
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = LogController;