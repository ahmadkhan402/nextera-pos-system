import { swalConfig } from '../../lib/sweetAlert';

export function AlertDemo() {
  const showSuccessDemo = () => {
    swalConfig.success('Your data has been saved successfully!');
  };

  const showErrorDemo = () => {
    swalConfig.error('Failed to process your request. Please try again.');
  };

  const showWarningDemo = () => {
    swalConfig.warning('This action cannot be undone. Please proceed with caution.');
  };

  const showInfoDemo = () => {
    swalConfig.info('New features are available in the latest update!');
  };

  const showConfirmDemo = async () => {
    const result = await swalConfig.confirm(
      'Are you sure?',
      'Do you want to proceed with this action?',
      'Yes, continue!'
    );
    if (result.isConfirmed) {
      swalConfig.success('Action completed successfully!');
    }
  };

  const showDeleteDemo = async () => {
    const result = await swalConfig.deleteConfirm('product');
    if (result.isConfirmed) {
      swalConfig.success('Product deleted successfully!');
    }
  };

  const showInputDemo = async () => {
    const result = await swalConfig.input('Enter your name', 'Type your full name here');
    if (result.isConfirmed && result.value) {
      swalConfig.success(`Hello, ${result.value}!`);
    }
  };

  const showLoadingDemo = () => {
    swalConfig.loading('Processing your request...');
    setTimeout(() => {
      swalConfig.close();
      swalConfig.success('Request completed successfully!');
    }, 3000);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SweetAlert2 Style Demo
          </h1>
          <p className="text-gray-600">
            Test the beautifully styled alerts that match your system design
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Toast Alerts */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Toast Notifications</h3>
            <div className="space-y-3">
              <button
                onClick={showSuccessDemo}
                className="btn btn-success btn-md w-full"
              >
                Success Toast
              </button>
              <button
                onClick={showErrorDemo}
                className="btn btn-danger btn-md w-full"
              >
                Error Toast
              </button>
              <button
                onClick={showWarningDemo}
                className="btn bg-yellow-500 hover:bg-yellow-600 text-white btn-md w-full"
              >
                Warning Toast
              </button>
              <button
                onClick={showInfoDemo}
                className="btn btn-primary btn-md w-full"
              >
                Info Toast
              </button>
            </div>
          </div>

          {/* Modal Alerts */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modal Dialogs</h3>
            <div className="space-y-3">
              <button
                onClick={showConfirmDemo}
                className="btn btn-primary btn-md w-full"
              >
                Confirmation Dialog
              </button>
              <button
                onClick={showDeleteDemo}
                className="btn btn-danger btn-md w-full"
              >
                Delete Confirmation
              </button>
              <button
                onClick={showInputDemo}
                className="btn btn-secondary btn-md w-full"
              >
                Input Dialog
              </button>
              <button
                onClick={showLoadingDemo}
                className="btn bg-purple-500 hover:bg-purple-600 text-white btn-md w-full"
              >
                Loading Dialog
              </button>
            </div>
          </div>

          {/* Design Features */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Features</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Rounded corners (2xl/3xl)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>System color palette</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Custom button styling</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Smooth animations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Hover interactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Inter font family</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
