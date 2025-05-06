export default function AIPlaceholder() {
    return (
      <div className="max-w-lg mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">AI Assistant</h2>
        <div className="border rounded p-4 bg-white dark:bg-gray-800">
          <textarea
            disabled
            className="w-full p-2 bg-gray-50 dark:bg-gray-700 cursor-not-allowed"
            rows={4}
            placeholder="AI suggestions will appear here"
          />
        </div>
      </div>
    );
  }
  