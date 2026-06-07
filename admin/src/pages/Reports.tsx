import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { reportApi } from "../services/api";
import type {
  CreateReportDto,
  TargetType,
  ReportCategory,
  GetReportResponseDto,
} from "../types";
import { useLanguage } from "../contexts/LanguageContext";

export function Reports() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<CreateReportDto>({
    targetId: "",
    targetType: "PRODUCT",
    category: "SPAM",
    title: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [reportResult, setReportResult] = useState<GetReportResponseDto | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const result = await reportApi.create(formData);

      // Show success message
      alert(
        "Report submitted successfully! Report ID: #" + result.id.slice(0, 8),
      );

      // Reset form
      setFormData({
        targetId: "",
        targetType: "PRODUCT",
        category: "SPAM",
        title: "",
        description: "",
      });

      // Optionally set result for display
      setReportResult(result);
    } catch (error) {
      console.error("Failed to create report:", error);
      alert("Failed to create report");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      REVIEWING:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      RESOLVED:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    };
    return (
      colors[status] ||
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Create Report
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Report content or users that violate community guidelines
        </p>
      </div>

      {/* Report Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="space-y-4">
            {/* Target Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Type *
              </label>
              <select
                required
                value={formData.targetType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetType: e.target.value as TargetType,
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PRODUCT">Product</option>
                <option value="REVIEW">Review</option>
                <option value="USER">User</option>
                <option value="ORDER">Order</option>
              </select>
            </div>

            {/* Target ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target ID *
              </label>
              <input
                type="text"
                required
                value={formData.targetId}
                onChange={(e) =>
                  setFormData({ ...formData, targetId: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the ID of the item to report"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as ReportCategory,
                  })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SPAM">Spam</option>
                <option value="INAPPROPRIATE">Inappropriate Content</option>
                <option value="SCAM">Scam or Fraud</option>
                <option value="COPYRIGHT">Copyright Violation</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief summary of the issue"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provide detailed information about why you're reporting this..."
              />
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-400">
                <p className="font-medium mb-1">Before submitting</p>
                <p>
                  Please ensure your report is accurate and includes all
                  relevant details. False reports may result in account
                  penalties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData({
                targetId: "",
                targetType: "PRODUCT",
                category: "SPAM",
                title: "",
                description: "",
              })
            }
            className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Report Result */}
      {reportResult && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 bg-green-50 dark:bg-green-950/20 border-b border-green-200 dark:border-green-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-400">
                  Report Submitted Successfully
                </h3>
                <p className="text-sm text-green-700 dark:text-green-500">
                  Your report has been received and will be reviewed by our team
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Report ID
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  #{reportResult.id.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Status
                </p>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reportResult.status)}`}
                >
                  {reportResult.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Target Type
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {reportResult.targetType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Category
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {reportResult.category}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Title
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                {reportResult.title}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Description
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {reportResult.description}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Submitted on {new Date(reportResult.createdAt).toLocaleString()}
              </p>
            </div>

            {reportResult.note && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Admin Note
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {reportResult.note}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setReportResult(null)}
              className="w-full px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
