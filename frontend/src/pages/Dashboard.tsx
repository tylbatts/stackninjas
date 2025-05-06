export default function Dashboard() {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">Welcome!</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {['Submit Ticket','My Tickets','AI Assistant'].map((label) => (
            <div
              key={label}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col items-center justify-center"
            >
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">{label}</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Coming Soon</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  