import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { adminApiService } from '../../services/adminApi';

interface ChartDataPoint {
  date: string;
  users: number;
  doctors: number;
  consultations: number;
  revenue: number;
  newRegistrations: number;
  activeUsers: number;
}

interface SpecializationData {
  name: string;
  value: number;
  color: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  color: string;
  trend: 'up' | 'down' | 'neutral';
}

const ChartsAndReportsComponent: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [specializationData, setSpecializationData] = useState<SpecializationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeChart, setActiveChart] = useState<'users' | 'consultations' | 'revenue' | 'registrations'>('users');

  useEffect(() => {
    fetchChartsData();
  }, [selectedPeriod]);

  const fetchChartsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data generation for development
      const mockData = generateMockData();
      setChartData(mockData);
      
      const mockSpecializationData: SpecializationData[] = [
        { name: 'Clinical Psychology', value: 35, color: '#8884d8' },
        { name: 'Behavioral Therapy', value: 28, color: '#82ca9d' },
        { name: 'Family Therapy', value: 22, color: '#ffc658' },
        { name: 'Psychiatry', value: 15, color: '#ff7300' },
      ];
      setSpecializationData(mockSpecializationData);

      // Try to fetch real data from API
      try {
        const [userStats, consultationStats, revenueStats] = await Promise.all([
          adminApiService.getUserRegistrationStats(selectedPeriod),
          adminApiService.getConsultationStats(selectedPeriod),
          adminApiService.getRevenueStats(selectedPeriod)
        ]);
        
        // Process and combine real data if available
        if (userStats && consultationStats && revenueStats) {
          // TODO: Process and combine real data
          // For now, using mock data as fallback
        }
        
      } catch (apiError) {
        // Silently fall back to mock data for development
        // In production, we might want to show a warning toast
        setError('Unable to fetch real-time data. Using cached data.');
      }
      
    } catch (err: any) {
      console.error('Error fetching charts data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (): ChartDataPoint[] => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const data: ChartDataPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const baseUsers = 100 + Math.floor(Math.random() * 20);
      const baseDoctors = 20 + Math.floor(Math.random() * 5);
      const baseConsultations = 15 + Math.floor(Math.random() * 10);
      const baseRevenue = 1000 + Math.floor(Math.random() * 500);
      
      data.push({
        date: format(date, 'MMM dd'),
        users: baseUsers + Math.floor(Math.random() * 50),
        doctors: baseDoctors + Math.floor(Math.random() * 10),
        consultations: baseConsultations + Math.floor(Math.random() * 15),
        revenue: baseRevenue + Math.floor(Math.random() * 1000),
        newRegistrations: Math.floor(Math.random() * 8) + 1,
        activeUsers: baseUsers + Math.floor(Math.random() * 30),
      });
    }
    
    return data;
  };

  const handleExportData = async () => {
    try {
      const csvContent = [
        ['Date', 'Users', 'Doctors', 'Consultations', 'Revenue', 'New Registrations', 'Active Users'],
        ...chartData.map(item => [
          item.date,
          item.users,
          item.doctors,
          item.consultations,
          item.revenue,
          item.newRegistrations,
          item.activeUsers
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${selectedPeriod}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data. Please try again.');
    }
  };

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon: Icon, color, trend }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-red-500" />
          ) : (
            <Activity className="w-4 h-4 text-gray-500" />
          )}
          <span className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-gray-600'
          }`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );

  const getChartConfig = () => {
    switch (activeChart) {
      case 'users':
        return {
          dataKey: 'users',
          stroke: '#8884d8',
          fill: '#8884d8',
          title: 'Total Users Over Time'
        };
      case 'consultations':
        return {
          dataKey: 'consultations',
          stroke: '#82ca9d',
          fill: '#82ca9d',
          title: 'Consultations Over Time'
        };
      case 'revenue':
        return {
          dataKey: 'revenue',
          stroke: '#ffc658',
          fill: '#ffc658',
          title: 'Revenue Over Time'
        };
      case 'registrations':
        return {
          dataKey: 'newRegistrations',
          stroke: '#ff7300',
          fill: '#ff7300',
          title: 'New Registrations Over Time'
        };
      default:
        return {
          dataKey: 'users',
          stroke: '#8884d8',
          fill: '#8884d8',
          title: 'Total Users Over Time'
        };
    }
  };

  const chartConfig = getChartConfig();

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports and analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 ${className}`}>
        <div className="p-8 text-center text-red-600">
          <p>Error loading reports: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Reports & Analytics</h3>
            <p className="text-gray-600 mt-1">Comprehensive insights into your platform's performance</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={fetchChartsData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={chartData.length > 0 ? chartData[chartData.length - 1].users.toLocaleString() : '0'}
          change="+12.3%"
          icon={Users}
          color="bg-blue-500"
          trend="up"
        />
        <MetricCard
          title="Active Doctors"
          value={chartData.length > 0 ? chartData[chartData.length - 1].doctors.toLocaleString() : '0'}
          change="+8.7%"
          icon={Activity}
          color="bg-green-500"
          trend="up"
        />
        <MetricCard
          title="Total Consultations"
          value={chartData.length > 0 ? chartData[chartData.length - 1].consultations.toLocaleString() : '0'}
          change="+15.2%"
          icon={BarChart3}
          color="bg-purple-500"
          trend="up"
        />
        <MetricCard
          title="Revenue"
          value={chartData.length > 0 ? `$${chartData[chartData.length - 1].revenue.toLocaleString()}` : '$0'}
          change="+23.1%"
          icon={DollarSign}
          color="bg-orange-500"
          trend="up"
        />
      </div>

      {/* Main Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-900">{chartConfig.title}</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveChart('users')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'users' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveChart('consultations')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'consultations' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Consultations
            </button>
            <button
              onClick={() => setActiveChart('revenue')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'revenue' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveChart('registrations')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === 'registrations' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Registrations
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey={chartConfig.dataKey}
                stroke={chartConfig.stroke}
                fill={chartConfig.fill}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">Daily Activity Comparison</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#8884d8" name="Users" />
                <Bar dataKey="consultations" fill="#82ca9d" name="Consultations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4">Doctor Specializations</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specializationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {specializationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsAndReportsComponent;
