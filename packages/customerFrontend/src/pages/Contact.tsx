import React, { useState } from "react";
import { MapPin, Phone, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { sendContactMessage, ContactMessage } from "@/services/api"; // Import from your API service

const ContactForm = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    status: "new",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear status when user starts typing again
    if (submitStatus.type) {
      setSubmitStatus({ type: null, message: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // 👇 Always ensure status is "pending" before sending
      const payload: ContactMessage = { ...formData, status: "new" };

      const response = await sendContactMessage(payload);

      if (response.success) {
        setSubmitStatus({
          type: "success",
          message:
            response.message ||
            t("contact.form.successMessage") ||
            "Thank you! We've received your message and will get back to you soon.",
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          status: "new",
        });

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
        }, 5000);
      } else {
        throw new Error(response.message || "Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          t("contact.form.errorMessage") ||
          "Oops! Something went wrong. Please try again later.",
      });

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-full mx-[10px] sm:mx-[50px] my-[10px] sm:my-[50px] rounded-[12px] overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <img
          src="/assets/images/conatct-us-banner.png"
          alt="Contact Banner"
          className="w-full h-80 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {t("contact.title")}
            </h1>
            <p className="text-lg md:text-xl">{t("contact.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information & Map */}
          <div className="space-y-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <MapPin className="text-ayamku-primary mt-1" size={20} />
                <div>
                  <p className="font-medium">{t("contact.address.line1")}</p>
                  <p className="text-gray-600">{t("contact.address.line2")}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Phone className="text-ayamku-primary" size={20} />
                <p>{t("contact.phone")}</p>
              </div>

              <div className="flex items-center space-x-4">
                <Mail className="text-ayamku-primary" size={20} />
                <p>{t("contact.email")}</p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-gray-200 h-96 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin size={48} className="mx-auto mb-4" />
                <p className="text-lg font-medium">{t("contact.map.title")}</p>
                <p className="text-sm">{t("contact.map.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* Success/Error Message */}
            {submitStatus.type && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
                  submitStatus.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {submitStatus.type === "success" ? (
                  <CheckCircle
                    className="text-green-600 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                ) : (
                  <AlertCircle
                    className="text-red-600 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                )}
                <p
                  className={`text-sm ${
                    submitStatus.type === "success"
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
                >
                  {submitStatus.message}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    name="firstName"
                    placeholder={t("contact.form.firstName")}
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Input
                    name="lastName"
                    placeholder={t("contact.form.lastName")}
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <input type="hidden" name="status" value={formData.status} />
              <div>
                <Input
                  name="email"
                  type="email"
                  placeholder={t("contact.form.email")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Input
                  name="phone"
                  type="tel"
                  placeholder={t("contact.form.phone")}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="subject" className="sr-only">
                  {t("contact.form.subject")}
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ayamku-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {t("contact.form.selectSubject") || "Select Subject"}
                  </option>
                  <option value="Feedback">
                    {t("contact.form.feedback") || "Feedback"}
                  </option>
                  <option value="Complaint">
                    {t("contact.form.complaint") || "Complaint"}
                  </option>
                  <option value="Inquiry">
                    {t("contact.form.inquiry") || "Inquiry"}
                  </option>
                </select>
              </div>

              <div>
                <Textarea
                  name="message"
                  placeholder={t("contact.form.message")}
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={500}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-ayamku-primary hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  t("contact.form.submit")
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;
