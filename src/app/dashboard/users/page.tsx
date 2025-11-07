'use client';

import { useState, useEffect, ReactElement } from 'react';
import axios from 'axios';
import { RiShieldUserLine, RiEdit2Line, RiDeleteBinLine, RiUserAddLine } from 'react-icons/ri';

// Define the User type based on the API response
interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'USER';
  isActive: boolean;
}

export default function UsersPage(): ReactElement {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.users);
      setError(null);
    } catch (err) {
      setError('Falha ao carregar usuários. Você tem permissão para ver esta página?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: User['role']) => {
    try {
        await axios.patch('/api/users', { userId, role: newRole });
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
        console.error("Failed to update role", error);
        alert("Falha ao atualizar o papel do usuário.");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
        await axios.patch('/api/users', { userId, isActive: newStatus });
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: newStatus } : u));
    } catch (error) {
        console.error("Failed to update status", error);
        alert("Falha ao atualizar o status do usuário.");
    }
  };


  if (loading) {
    return <div className="p-8 text-white">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 text-white">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
          <RiShieldUserLine className="mr-3 text-cyan-400" />
          Gerenciamento de Usuários
        </h1>
        {/* <button className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-emerald-600 transition-all duration-200 flex items-center">
          <RiUserAddLine className="mr-2" />
          Convidar Usuário
        </button> */}
      </header>

      <div className="bg-white/5 p-4 rounded-xl backdrop-blur-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4">Nome</th>
                <th className="p-4">Email</th>
                <th className="p-4">Papel</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-white/5 transition-colors">
                  <td className="p-4">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])} 
                        className="bg-gray-700 text-white rounded px-2 py-1 disabled:opacity-50"
                        disabled={user.role === 'OWNER'}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="USER">User</option>
                      {user.role === 'OWNER' && <option value="OWNER">Owner</option>}
                    </select>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                        onClick={() => handleStatusChange(user.id, !user.isActive)}
                        className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-2"
                        disabled={user.role === 'OWNER'}
                    >
                      {user.isActive ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}