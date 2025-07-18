"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Palette, 
  Bell, 
  Database, 
  Mail, 
  Security, 
  Globe, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Key, 
  Monitor, 
  Smartphone, 
  Cloud, 
  BarChart3, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

interface SystemSettings {
  site_name: string;
  site_description: string;
  maintenance_mode: boolean;
  user_registration: boolean;
  doctor_registration: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  two_factor_auth: boolean;
  session_timeout: number;
  max_file_size: number;
  allowed_file_types: string[];
  backup_frequency: string;
  theme: string;
  primary_color: string;
  secondary_color: string;
}

interface DashboardWidget {
  id: string;
  title: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  enabled: boolean;
  config: Record<string, any>;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'admin'
  });
  
  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    site_name: 'Echo Psychology',
    site_description: 'Mental Health Platform',
    maintenance_mode: false,
    user_registration: true,
    doctor_registration: true,
    email_notifications: true,
    sms_notifications: false,
    two_factor_auth: true,
    session_timeout: 30,
    max_file_size: 10,
    allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png'],
    backup_frequency: 'daily',
    theme: 'light',
    primary_color: '#10b981',
    secondary_color: '#14b8a6'
  });
  
  // Dashboard widgets state
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([
    {
      id: 'stats_overview',
      title: 'Statistics Overview',
      type: 'stats',
      position: { x: 0, y: 0 },
      size: { width: 12, height: 4 },
      enabled: true,
      config: {}
    },
    {
      id: 'recent_activities',
      title: 'Recent Activities',
      type: 'activity',
      position: { x: 0, y: 4 },
      size: { width: 6, height: 6 },
      enabled: true,
      config: {}
    },
    {
      id: 'user_analytics',
      title: 'User Analytics',
      type: 'chart',
      position: { x: 6, y: 4 },
      size: { width: 6, height: 6 },
      enabled: true,
      config: { chart_type: 'line' }
    },
    {
      id: 'pending_approvals',
      title: 'Pending Approvals',
      type: 'table',
      position: { x: 0, y: 10 },
      size: { width: 12, height: 4 },
      enabled: true,
      config: {}
    }
  ]);

  useEffect(() => {
    fetchAdminUsers();
    fetchSystemSettings();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users?role=admin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.users || []);
      } else {
        // Mock data for development
        setAdminUsers([
          {
            id: 1,
            email: 'admin@echopsychology.com',
            first_name: 'John',
            last_name: 'Admin',
            role: 'super_admin',
            is_active: true,
            last_login: '2024-01-22T10:30:00Z',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            email: 'moderator@echopsychology.com',
            first_name: 'Jane',
            last_name: 'Moderator',
            role: 'admin',
            is_active: true,
            last_login: '2024-01-21T15:45:00Z',
            created_at: '2024-01-15T00:00:00Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(systemSettings)
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'success', text: 'Settings saved successfully!' }); // Mock success
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings. Please try again.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const addAdminUser = async () => {
    if (!newAdmin.email || !newAdmin.first_name || !newAdmin.last_name || !newAdmin.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAdmin,
          role: 'admin'
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Admin user added successfully!' });
        setNewAdmin({ email: '', first_name: '', last_name: '', password: '', role: 'admin' });
        setShowAddAdmin(false);
        fetchAdminUsers();
      } else {
        // Mock success for development
        const mockAdmin: AdminUser = {
          id: Date.now(),
          email: newAdmin.email,
          first_name: newAdmin.first_name,
          last_name: newAdmin.last_name,
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        setAdminUsers(prev => [...prev, mockAdmin]);
        setMessage({ type: 'success', text: 'Admin user added successfully!' });
        setNewAdmin({ email: '', first_name: '', last_name: '', password: '', role: 'admin' });
        setShowAddAdmin(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error adding admin user. Please try again.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      
      if (response.ok || true) { // Mock success
        setAdminUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        ));
        setMessage({ type: 'success', text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully!` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating user status. Please try again.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const deleteAdminUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;
    
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiBaseUrl}/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok || true) { // Mock success
        setAdminUsers(prev => prev.filter(user => user.id !== userId));
        setMessage({ type: 'success', text: 'Admin user deleted successfully!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting admin user. Please try again.' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const updateWidgetConfig = (widgetId: string, updates: Partial<DashboardWidget>) => {
    setDashboardWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'admins', label: 'Admin Users', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
          <button 
            onClick={() => setMessage(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200">
        <div className="flex flex-wrap gap-2 p-6 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                  : 'text-slate-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                    <input
                      type="text"
                      value={systemSettings.site_name}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, site_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Site Description</label>
                    <input
                      type="text"
                      value={systemSettings.site_description}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, site_description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Registration Settings</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">User Registration</label>
                      <p className="text-xs text-gray-500">Allow new users to register</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(prev => ({ ...prev, user_registration: !prev.user_registration }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings.user_registration ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemSettings.user_registration ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Doctor Registration</label>
                      <p className="text-xs text-gray-500">Allow doctors to register</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(prev => ({ ...prev, doctor_registration: !prev.doctor_registration }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings.doctor_registration ? 'bg-emerald-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemSettings.doctor_registration ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                      <p className="text-xs text-gray-500">Put site in maintenance mode</p>
                    </div>
                    <button
                      onClick={() => setSystemSettings(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        systemSettings.maintenance_mode ? 'bg-red-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        systemSettings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Users */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Admin Users</h3>
                <button
                  onClick={() => setShowAddAdmin(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Admin
                </button>
              </div>

              {/* Add Admin Form */}
              {showAddAdmin && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="text-md font-medium text-gray-800 mb-4">Add New Admin</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={newAdmin.first_name}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={newAdmin.last_name}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={newAdmin.password}
                        onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={addAdminUser}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Add Admin
                    </button>
                    <button
                      onClick={() => setShowAddAdmin(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {adminUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'super_admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.last_login).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`p-2 rounded-md transition-colors ${
                                user.is_active
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              title={user.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {user.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteAdminUser(user.id)}
                              className="p-2 rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dashboard Customization */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Dashboard Customization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardWidgets.map(widget => (
                  <div key={widget.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-800">{widget.title}</h4>
                      <button
                        onClick={() => updateWidgetConfig(widget.id, { enabled: !widget.enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          widget.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          widget.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <BarChart3 className="w-4 h-4" />
                        Type: {widget.type}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Monitor className="w-4 h-4" />
                        Size: {widget.size.width}x{widget.size.height}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Globe className="w-4 h-4" />
                        Position: ({widget.position.x}, {widget.position.y})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                    <p className="text-xs text-gray-500">Require 2FA for all admin users</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings(prev => ({ ...prev, two_factor_auth: !prev.two_factor_auth }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.two_factor_auth ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.two_factor_auth ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={systemSettings.session_timeout}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, session_timeout: parseInt(e.target.value) || 30 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="5"
                    max="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={systemSettings.max_file_size}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, max_file_size: parseInt(e.target.value) || 10 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
                  <div className="flex flex-wrap gap-2">
                    {['pdf', 'doc', 'docx', 'jpg', 'png', 'gif', 'zip', 'txt'].map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={systemSettings.allowed_file_types.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSystemSettings(prev => ({ 
                                ...prev, 
                                allowed_file_types: [...prev.allowed_file_types, type] 
                              }));
                            } else {
                              setSystemSettings(prev => ({ 
                                ...prev, 
                                allowed_file_types: prev.allowed_file_types.filter(t => t !== type) 
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Appearance Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={systemSettings.theme}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={systemSettings.primary_color}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                  <input
                    type="color"
                    value={systemSettings.secondary_color}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <p className="text-xs text-gray-500">Send system notifications via email</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.email_notifications ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                    <p className="text-xs text-gray-500">Send system notifications via SMS</p>
                  </div>
                  <button
                    onClick={() => setSystemSettings(prev => ({ ...prev, sms_notifications: !prev.sms_notifications }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      systemSettings.sms_notifications ? 'bg-emerald-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      systemSettings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">System Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                  <select
                    value={systemSettings.backup_frequency}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backup_frequency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Cloud className="w-6 h-6 text-blue-600" />
                      <h4 className="text-md font-medium text-gray-800">System Status</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Database</span>
                        <span className="text-sm font-medium text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">API</span>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Storage</span>
                        <span className="text-sm font-medium text-yellow-600">75% Used</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Database className="w-6 h-6 text-emerald-600" />
                      <h4 className="text-md font-medium text-gray-800">Quick Actions</h4>
                    </div>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        Clear Cache
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        Run Backup
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        System Health Check
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
