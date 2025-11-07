"use client"

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, Line as RechartsLine } from 'recharts'
// Recebe prop opcional isDark para modo escuro

interface Transaction {
  id: string
  amount: string | number
  type: string
  date: string
  category?: {
    name: string
    color: string
  }
}

interface FinancialChartProps {
  transactions: Transaction[]
  onlyPie?: boolean
  onlyLine?: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function FinancialChart({ transactions, onlyPie, onlyLine }: FinancialChartProps) {
  // Preparar dados para gráfico de pizza (despesas por categoria)
  const expenseData = transactions
    .filter(t => t.type === 'expense' && t.category)
    .reduce((acc, transaction) => {
      const categoryName = transaction.category!.name
      const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount)
      
      const existing = acc.find(item => item.name === categoryName)
      if (existing) {
        existing.value += amount
      } else {
        acc.push({ name: categoryName, value: amount, color: transaction.category!.color })
      }
      return acc
    }, [] as Array<{ name: string; value: number; color: string }>)

  // Preparar dados para gráfico de linha (receitas vs despesas por mês)
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : Number(transaction.amount)
    
    const existing = acc.find(item => item.month === monthKey)
    if (existing) {
      if (transaction.type === 'income') {
        existing.income += amount
      } else {
        existing.expense += amount
      }
    } else {
      acc.push({
        month: monthKey,
        income: transaction.type === 'income' ? amount : 0,
        expense: transaction.type === 'expense' ? amount : 0,
      })
    }
    return acc
  }, [] as Array<{ month: string; income: number; expense: number }>)

  // Ordenar por mês
  monthlyData.sort((a, b) => a.month.localeCompare(b.month))

  // Formatar labels do mês
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    const date = new Date(parseInt(year), parseInt(monthNum) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  if (onlyPie) {
    return (
      <div className="w-full flex justify-center">
        {expenseData.length > 0 ? (
          <ResponsiveContainer width={220} height={220}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500">
            Nenhuma despesa encontrada
          </div>
        )}
      </div>
    )
  }
  if (onlyLine) {
    return (
      <div className="w-full flex justify-center">
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width={300} height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#00C49F" 
                strokeWidth={2}
                name="Receitas"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#FF8042" 
                strokeWidth={2}
                name="Despesas"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-500">
            Nenhuma transação encontrada
          </div>
        )}
      </div>
    )
  }
  // Default: ambos os gráficos
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Despesas por Categoria */}
      <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
        {expenseData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhuma despesa encontrada
          </div>
        )}
      </div>

      {/* Gráfico de Linha - Receitas vs Despesas */}
      <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                labelFormatter={formatMonth}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#00C49F" 
                strokeWidth={2}
                name="Receitas"
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#FF8042" 
                strokeWidth={2}
                name="Despesas"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhuma transação encontrada
          </div>
        )}
      </div>
    </div>
  )
} 

/**
 * Gráfico de Fluxo de Caixa
 * @param transactions - lista de transações
 * @param isDark - se true, força modo escuro; se false, claro; se undefined, detecta automaticamente
 */
export function CashFlowChart({ transactions, isDark }: { transactions: Transaction[]; isDark?: boolean }) {
  // Agrupar por dia do mês
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1)
  const dataByDay = daysInMonth.map(day => {
    const recebimentos = transactions.filter(t => t.type === 'income' && new Date(t.date).getDate() === day)
    const pagamentos = transactions.filter(t => t.type === 'expense' && new Date(t.date).getDate() === day)
    return {
      day,
      recebimentos: recebimentos.reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0),
      pagamentos: pagamentos.reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount)), 0),
    }
  })
  // Calcular saldo acumulado
  let saldo = 0
  const data = dataByDay.map(d => {
    saldo += d.recebimentos - d.pagamentos
    return { ...d, saldo }
  })

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} label={{ value: 'Dia', position: 'insideBottom', offset: -5 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
        <Legend verticalAlign="top" height={36} />
        <Bar dataKey="recebimentos" name="Recebimentos" fill="#22c55e" />
        <Bar dataKey="pagamentos" name="Pagamentos" fill="#ef4444" />
        <RechartsLine type="monotone" dataKey="saldo" name="Saldo Acumulado no Período" stroke="#666" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  )
} 