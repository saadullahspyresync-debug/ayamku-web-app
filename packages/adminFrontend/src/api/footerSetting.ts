import api from "./api";

export interface QuickLinks {
    exploreMenu: string;
    restaurantLocator: string;
    contactUs: string;
    aboutUs: string;
}

export interface ContactInfo {
    address1: string;
    address2: string;
    phone: string;
    email: string;
}

export interface FooterSet {
    id?: string; // Usually "settings"
    quickLinks: QuickLinks;
    contactInfo: ContactInfo;
}

// 2. Export the API Methods
export const getFooter = () => {
    return api.get("/footer");
};

export const updateFooter = (data: FooterSet) => {
    return api.post("/footer", data);
};

export default {
    getFooter,
    updateFooter,
};