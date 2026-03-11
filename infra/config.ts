export const cybersourceConfig = {
    "devs-venture-dev-machine": {
        environment: "devs-venture-dev-machine",
        cySour_api: "https://testsecureacceptance.cybersource.com/pay",
        frontend_url: "http://localhost:8080",
        api_base_url: "https://ec661icza2.execute-api.us-east-1.amazonaws.com"
    },
    development: {
        environment: "development",
        cySour_api: "https://testsecureacceptance.cybersource.com/pay",
        frontend_url: "https://customer-staging.ayamkubrunei.com",
        api_base_url: "https://e4girjfm00.execute-api.us-east-1.amazonaws.com"
    },
    production: {
        environment: "production",  
        cySour_api: "https://secureacceptance.cybersource.com/pay", 
        frontend_url: "https://www.ayamkubrunei.com",
        api_base_url: "https://kcq0clfya4.execute-api.us-east-1.amazonaws.com"
    },
};