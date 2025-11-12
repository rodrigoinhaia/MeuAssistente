"use client"

import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar, BarChart, Line as RechartsLine } from 'recharts'
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
  chartType?: 'pie' | 'bar' | 'line' | 'composed'
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#6B7280']

export default function FinancialChart({ transactions, onlyPie, onlyLine, chartType }: FinancialChartProps) {
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
    .sort((a, b) => b.value - a.value) // Ordenar por valor decrescente
    .map((item, index) => ({
      ...item,
      color: item.color || COLORS[index % COLORS.length],
      percent: 0 // Será calculado depois
    }))

  // Calcular percentuais
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0)
  expenseData.forEach(item => {
    item.percent = totalExpenses > 0 ? (item.value / totalExpenses) * 100 : 0
  })

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
      <div className="w-full">
        {expenseData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={280} className="max-w-[280px]">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `R$ ${value.toFixed(2)}`,
                    `${props.payload.percent.toFixed(1)}%`
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Categorias</h4>
              {expenseData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded flex-shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-700 truncate font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-slate-600 font-semibold">
                      {entry.percent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-slate-500 w-20 text-right">
                      R$ {entry.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      <div className="w-full">
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                labelFormatter={formatMonth}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6 }}
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
  // Default: ambos os gráficos com opção de tipo
  if (chartType === 'bar') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Despesas por Categoria */}
        <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Despesas por Categoria</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={70}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Nenhuma despesa encontrada
            </div>
          )}
        </div>

        {/* Gráfico de Linha - Receitas vs Despesas */}
        <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow-lg border border-slate-200/60 p-6">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Receitas vs Despesas</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                  labelFormatter={formatMonth}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Receitas"
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  name="Despesas"
                  dot={{ fill: '#EF4444', r: 4 }}
                  activeDot={{ r: 6 }}
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

  // Default: Pizza + Linha
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza - Despesas por Categoria */}
      <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow-lg border border-slate-200/60 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Despesas por Categoria</h3>
        {expenseData.length > 0 ? (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={280} className="max-w-[280px]">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `R$ ${value.toFixed(2)}`,
                    `${props.payload.percent.toFixed(1)}%`
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 w-full">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Categorias</h4>
              {expenseData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div 
                      className="w-4 h-4 rounded flex-shrink-0" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-700 truncate font-medium">{entry.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm text-slate-600 font-semibold">
                      {entry.percent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-slate-500 w-20 text-right">
                      R$ {entry.value.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Nenhuma despesa encontrada
          </div>
        )}
      </div>

      {/* Gráfico de Linha - Receitas vs Despesas */}
      <div className="bg-white dark:bg-gray-900 dark:text-gray-100 rounded-xl shadow-lg border border-slate-200/60 p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Receitas vs Despesas</h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                labelFormatter={formatMonth}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Receitas"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#EF4444" 
                strokeWidth={3}
                name="Despesas"
                dot={{ fill: '#EF4444', r: 4 }}
                activeDot={{ r: 6 }}
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