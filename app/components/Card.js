export default function Card({ title, value, change, positive }) {
  return (
    <div className="group bg-white hover:bg-[#003f20] transition-all duration-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between cursor-pointer">
      <div className="text-gray-900 text-sm group-hover:text-white transition-all duration-200">
        {title}
      </div>
      <div className="text-2xl font-bold text-black/70 group-hover:text-white transition-all duration-200">
        {value}
      </div>
      <div
        className={`text-sm font-medium ${
          positive ? "text-green-600 group-hover:text-green-300" : "text-red-600 group-hover:text-red-300"
        } transition-all duration-200`}
      >
        {change}
      </div>
    </div>
  );
}
