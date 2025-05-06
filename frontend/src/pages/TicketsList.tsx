export default function TicketsList() {
    return (
      <div className="overflow-x-auto">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">My Tickets</h2>
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <thead>
            <tr className="text-left">
              {['ID','Title','Status','Created At'].map((h) => (
                <th key={h} className="px-4 py-2 bg-gray-100 dark:bg-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1,2,3].map((i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  