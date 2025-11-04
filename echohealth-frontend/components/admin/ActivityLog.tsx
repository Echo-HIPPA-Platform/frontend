import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar, 
  User, 
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ActivityLog, ActivityLogFilters } from '../../types/admin';
import { adminApiService } from '../../services/adminApi';

interface ActivityLogComponentProps {
  className?: string;
}

const ActivityLogComponent: React.FC<ActivityLogComponentProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityLogFilters>({
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchActivityLogs();
  }, [filters]);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Apply search filter
      const searchFilters = { ...filters };
      if (searchTerm) {
        searchFilters.action = searchTerm;
      }
      if (selectedLevel) {
        searchFilters.level = selectedLevel;
      }
      if (selectedDateRange) {
        const now = new Date();
        const daysAgo = parseInt(selectedDateRange);
        const fromDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        searchFilters.date_from = fromDate.toISOString();
      }

      const response = await adminApiService.getActivityLogs(searchFilters);
      setLogs(response.data);
    } catch (err: any) {
      setError(
        'Unable to load activity logs. Please try refreshing the page. ' +
        'If the problem persists, ensure you have a stable internet connection or contact support.'
      );
      
      // Mock data for development
      const mockLogs: ActivityLog[] = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          level: 'info',
          action: 'User Login',
          details: 'User successfully logged in',
          user_id: 123,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          resource_type: 'user',
          resource_id: '123',
          metadata: { session_id: 'abc123', location: 'New York' }
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          level: 'warning',
          action: 'Failed Login Attempt',
          details: 'Invalid credentials provided',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          metadata: { attempts: 3, blocked: false }
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          level: 'error',
          action: 'Database Connection Error',
          details: 'Failed to connect to database: connection timeout',
          metadata: { database: 'main', timeout: 30000 }
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          level: 'info',
          action: 'Doctor Verification',
          details: 'Doctor profile verified successfully',
          user_id: 456,
          resource_type: 'doctor',
          resource_id: '456',
          metadata: { verified_by: 'admin_123', documents: ['license', 'certification'] }
        },
        {
          id: 5,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          level: 'debug',
          action: 'API Request',
          details: 'GET /api/v1/admin/dashboard - 200 OK',
          user_id: 789,
          ip_address: '192.168.1.102',
          metadata: { response_time: 245, endpoint: '/api/v1/admin/dashboard' }
        }
      ];
      setLogs(mockLogs);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivityLogs();
  };

  const handleExport = async () => {
    try {
      const blob = await adminApiService.exportActivityLogs(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    }
  };

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'debug':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleLogExpansion = (logId: number) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = !selectedLevel || log.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-medium">
              {filteredLogs.length} entries
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs by action or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>

              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Time</option>
                <option value="1">Last 24 Hours</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>

              <button
                onClick={() => {
                  setSelectedLevel('');
                  setSelectedDateRange('');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log Entries */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading activity logs...</p>
          </div>
        ) : error && filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No activity logs available</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No logs match your search criteria</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getLogLevelIcon(log.level)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                      
                      {/* Basic info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {log.user_id && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User ID: {log.user_id}
                          </span>
                        )}
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                        {log.resource_type && (
                          <span>Resource: {log.resource_type}</span>
                        )}
                      </div>

                      {/* Expanded details */}
                      {expandedLogs.has(log.id) && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {log.user_agent && (
                              <div>
                                <span className="font-medium text-gray-700">User Agent:</span>
                                <p className="text-gray-600 break-all">{log.user_agent}</p>
                              </div>
                            )}
                            {log.metadata && (
                              <div>
                                <span className="font-medium text-gray-700">Metadata:</span>
                                <pre className="text-gray-600 text-xs mt-1 overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleLogExpansion(log.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedLogs.has(log.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredLogs.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredLogs.length} entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset! - filters.limit!) })}
                disabled={filters.offset === 0}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, offset: filters.offset! + filters.limit! })}
                disabled={filteredLogs.length < filters.limit!}
                className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogComponent;
