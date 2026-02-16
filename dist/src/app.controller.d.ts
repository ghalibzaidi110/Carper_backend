export declare class AppController {
    getWelcome(): {
        message: string;
        version: string;
        status: string;
        docs: string;
        endpoints: {
            auth: string;
            users: string;
            cars: string;
            marketplace: string;
            rentals: string;
            damageDetection: string;
        };
        timestamp: string;
    };
}
