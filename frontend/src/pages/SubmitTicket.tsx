export default function SubmitTicket() {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Submit Ticket
        </h2>
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-200">Title</label>
            <input disabled className="w-full mt-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200">Description</label>
            <textarea disabled className="w-full mt-1 p-2 border rounded bg-gray-50 dark:bg-gray-700 cursor-not-allowed" rows={4}/>
          </div>
          <button disabled className="py-2 px-4 bg-indigo-600 text-white rounded opacity-50 cursor-not-allowed">
            Submit
          </button>
        </form>
      </div>
    );
  }
  