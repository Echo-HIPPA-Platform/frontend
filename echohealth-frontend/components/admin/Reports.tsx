import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { adminApiService } from '../../services/adminApi';
import { ReportData, ChartDataPoint } from '../../types/admin';

interface ReportsComponentProps {
  className?: string;
}

const ReportsComponent: React.FC<ReportsComponentProps> = ({ className = '' }) => {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const response = await adminApiService.getReportsData();
      setReports(response.data);
    } catch (err: any) {
      console.error('Error fetching reports data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = (data: ChartDataPoint[], key: string, color: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey={key} stroke={color} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) return <div className="p-8 text-center">Loading reports...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!reports) return <div className="p-8 text-center">No report data available</div>;

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900">Reports Dashboard</h3>
        <p className="text-lg text-slate-600 mt-2">Visual insights and analytics.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">User Registrations</h4>
            {renderChart(reports.user_registrations, 'total', '#8884d8')}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Consultations</h4>
            {renderChart(reports.consultation_stats, 'completed', '#82ca9d')}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-800">Revenue</h4>
            {renderChart(reports.revenue_analytics, 'revenue', '#ffc658')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsComponent;
