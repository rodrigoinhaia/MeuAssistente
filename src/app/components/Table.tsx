interface TableProps {
  headers: string[]
  children: React.ReactNode
}

export default function Table({ headers, children }: TableProps) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-800 text-gray-400">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-4 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {children}
        </tbody>
      </table>
    </div>
  )
}

export function TableRow({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <tr className={`bg-gray-900 hover:bg-gray-800/50 transition-colors ${className}`}>
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap ${className}`}>
      {children}
    </td>
  )
}
