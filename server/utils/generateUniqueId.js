const generateUniqueId = () => {
    // Custom logic to generate unique ID in the format ABC1234D
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < 3; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 4; i++) {
        result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    result += letters.charAt(Math.floor(Math.random() * letters.length));
    return result;
};

module.exports = { generateUniqueId };
