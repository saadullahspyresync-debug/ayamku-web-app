import api from "./api";

// This is for creating the template in your library
export type ThemeTemplatePayload = {
    themeName: string;      // e.g., "Ramadan", "National Day"
    primaryColor: string;    // e.g., "#FFD700"
    bannerImg: File | null;       // S3 URL for the festive banner
    existingImage?: string | null;
};

// This is for selecting a template and making it the active website theme
export type UpdateLivePayload = {
    templateId: string;      // The ID of the template being activated
    themeName: string;
    primaryColor: string;
    bannerImg: File | null;
    existingImage?: string | null;
};

// 1. Get the current LIVE theme (What customers see on the website right now)
export const getActiveTheme = () => {
    return api.get("/theme/active");
};

// 2. Get all created theme templates (The Library: Ramadan, National Day, etc.)
export const getAllThemeTemplates = () => {
    return api.get("/theme/templates");
};

// 3. Select & Publish a theme (Admin picks a template to go live)
export const updateLiveTheme = (data: UpdateLivePayload) => {
    return api.post("/theme/active/update", data);
};

// 4. Create a new Theme Template (Add a new event to your library)
export const createThemeTemplate = (data: ThemeTemplatePayload) => {
    return api.post("/theme/templates", data);
};

// 5. Edit an existing template in the library
export const editThemeTemplate = (id: string, data: Partial<ThemeTemplatePayload>) => {
    return api.patch(`/theme/templates/${id}`, data);
};

// 6. Delete a theme template from the library
export const deleteThemeTemplate = (id: string) => {
    return api.delete(`/theme/templates/${id}`);
};

export default {
    getActiveTheme,
    getAllThemeTemplates,
    updateLiveTheme,
    createThemeTemplate,
    editThemeTemplate,
    deleteThemeTemplate,
};
