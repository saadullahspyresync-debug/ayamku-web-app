import React, { useState, useEffect } from "react";
import { MapPin, Phone, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { sendContactMessage, ContactMessage, FooterSettings, fetchFooterData } from "@/services/api"; // Import from your API service
import { useBranchStore } from "@/store/branchStore";
import { useTheme } from "@/contexts/ThemeProvider";

const ContactForm = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    status: "new",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [footerData, setFooterData] = useState<FooterSettings | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const branchId = useBranchStore.getState().selectedBranch?.branchId;

  
  useEffect(() => {
    const getFooter = async () => {
      try {
        const data = await fetchFooterData();
        setFooterData(data);
      } catch (error) {
        console.error("Failed to load footer data:", error);
      }
    };

    getFooter();
  }, []);

  // --- Manual Validation Function ---
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    if (formData.firstName.trim().length < 2) newErrors.firstName = "First name is too short";
    if (formData.lastName.trim().length < 2) newErrors.lastName = "Last name is too short"; 

    // Phone and Email validation
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) newErrors.phone = "Invalid mobile number";
    if (phoneDigits.length > 10) newErrors.phone = "Enter valid mobile number without (+)";
    if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address";

    // Subject and Message validation 
    if (!formData.subject) newErrors.subject = "Please select a subject";
    if (formData.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters";
      

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


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

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // 👇 Always ensure status is "pending" before sending
      const payload: ContactMessage = { ...formData, status: "new", branchId };

      const response = await sendContactMessage(payload);

      if (response.success) {
        setSubmitStatus({
          type: "success",
          message:
            response.message ||
            t("contact.form.successMessage") 
        });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus({ type: null, message: "" });
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

        }, 3000);
      } else {
        throw new Error(response.message || "Failed to submit form");
      }
    } catch (error) {
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
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="relative h-full mx-[10px] sm:mx-[50px] my-[10px] sm:my-[50px] rounded-[12px] overflow-hidden">
        <div className="relative w-full h-40 sm:h-60 md:h-[400px] lg:h-[600px]">
          <img
            src={theme?.bannerImg ?? "/assets/images/conatct-us-banner.png"}
            alt="Contact Banner"
            className="absolute inset-0 w-full h-full object-center"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
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
                  <p className="font-medium">{footerData? footerData.contactInfo.address1 : t("contact.address.line1")}</p>
                  <p className="text-gray-600">{footerData? footerData.contactInfo.address2 : t("contact.address.line2")}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Phone className="text-ayamku-primary" size={20} />
                <p>{footerData? `+ ${footerData.contactInfo.phone}` : t("contact.phone")}</p>
              </div>

              <div className="flex items-center space-x-4">
                <Mail className="text-ayamku-primary" size={20} />
                <p>{footerData? footerData.contactInfo.email : t("contact.email")}</p>
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
                    disabled={isSubmitting}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Input
                    name="lastName"
                    placeholder={t("contact.form.lastName")}
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
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
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Input
                  name="phone"
                  type="tel"
                  placeholder="Enter your mobile number  (e.g. 6731234567)"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
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
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}
              </div>

              <div>
                <Textarea
                  name="message"
                  placeholder={t("contact.form.message")}
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}
                <p className="text-sm text-gray-500 mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-ayamku-primary hover:bg-ayamku-primary/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
