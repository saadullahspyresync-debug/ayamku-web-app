import api from "./api";

export interface ContactFormMessage {
  _id?: string;
  branchId?: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status?: "new" | "pending" | "resolved";
  submittedAt?: string;
  updatedAt?: string;
}

// GET all contact form messages (admin only)
export const getAllContactMessages = () =>
  api.get<ContactFormMessage[]>("/admin/contact");

// GET a single contact message by ID (admin only)
export const getContactMessageById = (id: string) =>
  api.get<ContactFormMessage>(`/contact-form/${id}`);

// CREATE a new contact form message (public)
export const createContactMessage = (
  data: Omit<ContactFormMessage, "_id" | "status" | "createdAt" | "updatedAt">
) => api.post<ContactFormMessage>("/contact-form", data);

// UPDATE a contact form message by ID (admin only) — e.g., update status
export const updateContactMessage = (
  id: string,
  data: Partial<ContactFormMessage>
) =>
  api.patch<ContactFormMessage>(`/admin/contact/${id}/status`, {
    status: data.status,
  });

// DELETE a contact form message by ID (admin only)
export const deleteContactMessage = (id: string) => api.delete(`/admin/contact/${id}`);

// Send a reply to a contact form message
export const sendAdminReply = (email: string, subject: string, replyText: string) => {
  const resp = api.post(`/admin/sendMail`, {
    email,
    subject,
    replyText
  });
  return resp;
}

export default {
  getAllContactMessages,
  getContactMessageById,
  createContactMessage,
  updateContactMessage,
  deleteContactMessage,
  sendAdminReply,
};
