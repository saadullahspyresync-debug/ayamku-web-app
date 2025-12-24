import { useTranslation } from "react-i18next";

type OrderFilterBarProps = {

  filters: {
    status: string;
    startDate: string | null;
    endDate: string | null;
  };

  onChange: (filters: {
    status: string;
    startDate: string | null;
    endDate: string | null;
  }) => void;
};

export const OrderFilterBar = ({
  filters,
  onChange,
}: OrderFilterBarProps) => {
  const { t } = useTranslation();

  return (
    <div className="">
      <div className="bg-white border rounded-2xl shadow-sm p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span
            className={"bg-ayamku-primary text-white border-ayamku-primary px-3 py-1 rounded"}
          >
            {t("Filters")}
          </span>
        </div>

        {/* Filters */}        
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                {t("Status")}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  onChange({ ...filters, status: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="all">{t("All")}</option>
                <option value="pending">{t("Pending")}</option>
                <option value="completed">{t("Completed")}</option>
                <option value="cancelled">{t("Cancelled")}</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                {t("From Date")}
              </label>
              <input
                type="date"
                value={filters.startDate ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, startDate: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                {t("To Date")}
              </label>
              <input
                type="date"
                value={filters.endDate ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, endDate: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
      </div>
    </div>
  );
};
