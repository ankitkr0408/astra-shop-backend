import axios from 'axios';

const shiprocketLogin = async (): Promise<string> => {
    try {
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        });
        return response.data.token;
    } catch (error: any) {
        console.error('Shiprocket Login Error:', error.message);
        throw new Error('Shiprocket Authentication Failed');
    }
};

const createShiprocketOrder = async (orderData: any): Promise<any> => {
    try {
        const token = await shiprocketLogin();
        const response = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', orderData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Shiprocket Create Order Error:', error.message);
        throw new Error('Failed to create order in Shiprocket');
    }
};

export { createShiprocketOrder };