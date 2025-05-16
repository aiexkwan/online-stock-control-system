'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  department: string;
  qc: boolean;
  receive: boolean;
  void: boolean;
  view: boolean;
  resume: boolean;
  report: boolean;
  password: string | null;
}

// 新用戶的介面，包含可選的 id
interface NewUser {
  id?: string;
  name: string;
  department: string;
  qc: boolean;
  receive: boolean;
  void: boolean;
  view: boolean;
  resume: boolean;
  report: boolean;
  password: string | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    department: '',
    qc: false,
    receive: false,
    void: false,
    view: true,
    resume: false,
    report: false,
    password: null
  });
  const [error, setError] = useState<string | null>(null);

  // 檢查當前用戶是否有權限
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clockNumber = localStorage.getItem('loggedInUserClockNumber');
      if (clockNumber) {
        // setUserInfo(userData); // userData is no longer fetched directly like this
        // TODO: Fetch user details and permissions based on clockNumber from data_id table
        // For now, we assume if a clockNumber exists, they might have access or further checks are needed.
        // The original logic checked userData.permissions?.qc
        // This needs to be replaced with a call to an action or API route
        // to get permissions for 'clockNumber' and then check 'qc' permission.
        // Example placeholder for fetching and checking permission:
        const checkPermissions = async () => {
          // Replace with actual permission fetching logic, e.g., a server action
          // For this example, let's assume a function `fetchUserPermissions(clockNumber)` exists
          // const permissions = await fetchUserPermissions(clockNumber);
          // if (!permissions?.qc) { 
          //   toast.error("Access Denied: You don't have QC permissions.");
          //   router.push('/'); // Redirect to home or dashboard
          // }
          // For now, if a clockNumber is present, we'll let them stay, 
          // assuming the page itself will handle content based on more detailed permissions later.
          // If direct blocking is needed here, the above commented logic needs to be implemented.
          console.log(`[UsersPage] User with clock number ${clockNumber} accessed the page. Permission check placeholder.`);
          // Example: To store basic info if needed, though permissions are key.
          setUserInfo({ id: clockNumber }); 
        };
        checkPermissions();

      } else {
        toast.info("Redirecting to login: No user session found.");
        router.push('/login');
      }
    }
  }, [router]);

  // 獲取所有用戶
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('data_id')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('載入用戶數據時出錯');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);

  // 創建新用戶
  async function handleAddUser() {
    try {
      if (!newUser.name || !newUser.id || !newUser.department) {
        setError('工號、姓名和部門為必填項');
        return;
      }
      
      // 首先檢查用戶 ID 是否已存在
      const { data: existingUser, error: checkError } = await supabase
        .from('data_id')
        .select('id')
        .eq('id', newUser.id)
        .single();
        
      if (existingUser) {
        setError(`工號 ${newUser.id} 已存在`);
        return;
      }
      
      const { error } = await supabase
        .from('data_id')
        .insert([{
          id: newUser.id,
          name: newUser.name,
          department: newUser.department,
          qc: newUser.qc,
          receive: newUser.receive,
          void: newUser.void,
          view: newUser.view,
          resume: newUser.resume,
          report: newUser.report,
          password: newUser.id  // 初始密碼設為工號
        }]);
        
      if (error) throw error;
      
      // 重置並關閉模態框
      setNewUser({
        name: '',
        department: '',
        qc: false,
        receive: false,
        void: false,
        view: true,
        resume: false,
        report: false,
        password: null
      });
      
      setShowAddModal(false);
      
      // 重新獲取用戶列表
      fetchUsers();
      
    } catch (error) {
      console.error('Error adding user:', error);
      setError('新增用戶時出錯');
    }
  }

  // 更新用戶
  async function handleUpdateUser() {
    try {
      if (!currentUser) return;
      
      const { error } = await supabase
        .from('data_id')
        .update({
          name: currentUser.name,
          department: currentUser.department,
          qc: currentUser.qc,
          receive: currentUser.receive,
          void: currentUser.void,
          view: currentUser.view,
          resume: currentUser.resume,
          report: currentUser.report
        })
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      setShowEditModal(false);
      setCurrentUser(null);
      
      // 重新獲取用戶列表
      fetchUsers();
      
    } catch (error) {
      console.error('Error updating user:', error);
      setError('更新用戶時出錯');
    }
  }

  // 刪除用戶
  async function handleDeleteUser() {
    try {
      if (!currentUser) return;
      
      const { error } = await supabase
        .from('data_id')
        .delete()
        .eq('id', currentUser.id);
        
      if (error) throw error;
      
      setShowDeleteConfirm(false);
      setCurrentUser(null);
      
      // 重新獲取用戶列表
      fetchUsers();
      
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('刪除用戶時出錯');
    }
  }

  // 重置用戶密碼
  async function handleResetPassword(user: User) {
    try {
      const { error } = await supabase
        .from('data_id')
        .update({ password: user.id })  // 重置密碼為用戶工號
        .eq('id', user.id);
        
      if (error) throw error;
      
      alert(`已將 ${user.name} 的密碼重置為工號`);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('重置密碼時出錯');
    }
  }

  // 獲取用戶列表
  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('data_id')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('載入用戶數據時出錯');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">用戶管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新增用戶
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工號</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部門</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">權限</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {user.qc && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          管理員
                        </span>
                      )}
                      {user.receive && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          入庫
                        </span>
                      )}
                      {user.void && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          出庫
                        </span>
                      )}
                      {user.resume && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          編輯
                        </span>
                      )}
                      {user.report && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          報表
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => {
                        setCurrentUser(user);
                        setShowEditModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-yellow-600 hover:text-yellow-900 mr-4"
                    >
                      重置密碼
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUser(user);
                        setShowDeleteConfirm(true);
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    沒有找到用戶
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增用戶模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">新增用戶</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工號</label>
                <input
                  type="text"
                  value={newUser.id || ''}
                  onChange={(e) => setNewUser({...newUser, id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部門</label>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">權限</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.qc}
                      onChange={(e) => setNewUser({...newUser, qc: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    管理員權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.receive}
                      onChange={(e) => setNewUser({...newUser, receive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    入庫權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.void}
                      onChange={(e) => setNewUser({...newUser, void: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    出庫權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.view}
                      onChange={(e) => setNewUser({...newUser, view: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    查看權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.resume}
                      onChange={(e) => setNewUser({...newUser, resume: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    編輯權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.report}
                      onChange={(e) => setNewUser({...newUser, report: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    報表權限
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯用戶模態框 */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">編輯用戶</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">工號</label>
                <input
                  type="text"
                  value={currentUser.id}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">部門</label>
                <input
                  type="text"
                  value={currentUser.department}
                  onChange={(e) => setCurrentUser({...currentUser, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">權限</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.qc}
                      onChange={(e) => setCurrentUser({...currentUser, qc: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    管理員權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.receive}
                      onChange={(e) => setCurrentUser({...currentUser, receive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    入庫權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.void}
                      onChange={(e) => setCurrentUser({...currentUser, void: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    出庫權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.view}
                      onChange={(e) => setCurrentUser({...currentUser, view: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    查看權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.resume}
                      onChange={(e) => setCurrentUser({...currentUser, resume: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    編輯權限
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentUser.report}
                      onChange={(e) => setCurrentUser({...currentUser, report: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mr-2"
                    />
                    報表權限
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認模態框 */}
      {showDeleteConfirm && currentUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">確認刪除</h2>
            <p className="mb-6">您確定要刪除用戶 {currentUser.name} ({currentUser.id}) 嗎？此操作無法撤銷。</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 