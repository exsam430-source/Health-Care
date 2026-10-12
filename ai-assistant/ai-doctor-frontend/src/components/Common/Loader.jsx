const Loader = ({ text = "AI is thinking..." }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin-slow" />
      <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-600 rounded-full animate-spin" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">🤖</div>
    </div>
    <p className="mt-4 text-gray-500 font-medium animate-pulse">{text}</p>
  </div>
);

export default Loader;