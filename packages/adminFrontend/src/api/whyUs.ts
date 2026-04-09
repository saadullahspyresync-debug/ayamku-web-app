import api from "./api";

export interface WhyUsItem {
    id?: string;
    title: string;
    description: string;
    image: File | string | null;
}


export const getAll = () => {
    return api.get("/why-us");
};

export const create = (data: WhyUsItem) => {
    return api.post("/why-us", data);
};

export const deleteWhyChooseUS = (id: string) => {
    return api.delete(`/why-us/${id}`);
};

export default {
    getAll,
    create,
    deleteWhyChooseUS,
};

