import { Loader } from "lucide-react";

const Spinner = ({ size = 20 }) => {
  return (
    <div className="inset-0 flex items-center justify-center mt-[25%] bg-transparent">
      <Loader className="animate-spin text-gray-500 dark:text-gray-400 transition-colors duration-300" size={size} />
    </div>
  );
};

export default Spinner;
