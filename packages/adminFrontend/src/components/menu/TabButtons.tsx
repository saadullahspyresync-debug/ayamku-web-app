type TabButtonsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export const TabButtons = ({ activeTab, onTabChange }: TabButtonsProps) => {
  const tabs = ["items", "categories", "deals"];

  return (
    <div className="flex gap-4 border-b pb-2">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className={`px-4 py-2 rounded-t text-sm font-medium transition ${
            activeTab === t
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 hover:bg-gray-200"
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
};