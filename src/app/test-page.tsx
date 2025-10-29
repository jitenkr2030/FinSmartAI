export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Test Page</h1>
        <p className="text-xl mb-6">If you see this with blue background and white text, CSS is working!</p>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-2">CSS Features Test</h2>
          <ul className="space-y-2">
            <li className="flex items-center">
              <div className="w-4 h-4 bg-green-400 rounded-full mr-3"></div>
              <span>Gradient backgrounds</span>
            </li>
            <li className="flex items-center">
              <div className="w-4 h-4 bg-yellow-400 rounded-full mr-3"></div>
              <span>Backdrop blur effects</span>
            </li>
            <li className="flex items-center">
              <div className="w-4 h-4 bg-red-400 rounded-full mr-3"></div>
              <span>Rounded corners</span>
            </li>
            <li className="flex items-center">
              <div className="w-4 h-4 bg-purple-400 rounded-full mr-3"></div>
              <span>Flexbox layouts</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}