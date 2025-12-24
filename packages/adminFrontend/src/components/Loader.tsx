type LoaderProps = {
  tab: string;
};

export const Loader = ({ tab }: LoaderProps) => (
  <div className="flex justify-center items-center py-10">
    <div className="flex flex-col items-center">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 mt-3">Loading {tab}...</p>
    </div>
  </div>
);