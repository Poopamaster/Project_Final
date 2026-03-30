// backend/src/middleware/validate.js
// ใช้งาน: router.post('/', validate(schema), controller)

/**
 * Middleware factory สำหรับ validate request body
 * รับ schema object ที่มี key = field name, value = array ของ validator functions
 *
 * ตัวอย่าง schema:
 * {
 *   name:     [required(), isString(), maxLength(100)],
 *   price:    [required(), isNumber(), min(0)],
 *   email:    [required(), isEmail()],
 * }
 */
const validate = (schema) => (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];

        for (const rule of rules) {
            const error = rule(value, field);
            if (error) {
                errors.push(error);
                break; // หยุดที่ rule แรกที่ fail ของแต่ละ field
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors });
    }

    next();
};

// ==========================================
// 📦 Validator Functions
// ==========================================

const required = () => (value, field) => {
    if (value === undefined || value === null || value === '') {
        return `${field} is required`;
    }
};

const isString = () => (value, field) => {
    if (value !== undefined && typeof value !== 'string') {
        return `${field} must be a string`;
    }
};

const isNumber = () => (value, field) => {
    if (value !== undefined && (typeof value !== 'number' || isNaN(value))) {
        return `${field} must be a number`;
    }
};

const isEmail = () => (value, field) => {
    if (value !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field} must be a valid email address`;
    }
};

const isDate = () => (value, field) => {
    if (value !== undefined && isNaN(Date.parse(value))) {
        return `${field} must be a valid date`;
    }
};

const minLength = (min) => (value, field) => {
    if (value !== undefined && String(value).length < min) {
        return `${field} must be at least ${min} characters`;
    }
};

const maxLength = (max) => (value, field) => {
    if (value !== undefined && String(value).length > max) {
        return `${field} must not exceed ${max} characters`;
    }
};

const min = (minVal) => (value, field) => {
    if (value !== undefined && Number(value) < minVal) {
        return `${field} must be at least ${minVal}`;
    }
};

const max = (maxVal) => (value, field) => {
    if (value !== undefined && Number(value) > maxVal) {
        return `${field} must not exceed ${maxVal}`;
    }
};

const isIn = (allowedValues) => (value, field) => {
    if (value !== undefined && !allowedValues.includes(value)) {
        return `${field} must be one of: ${allowedValues.join(', ')}`;
    }
};

const isMongoId = () => (value, field) => {
    if (value !== undefined && !/^[a-fA-F0-9]{24}$/.test(value)) {
        return `${field} must be a valid ID`;
    }
};

// ==========================================
// 📋 Pre-built Schemas
// ==========================================

const schemas = {
    createShowtime: {
        movie_id:      [required(), isMongoId()],
        auditorium_id: [required(), isMongoId()],
        start_time:    [required(), isDate()],
        language:      [required(), isIn(['TH', 'EN', 'TH/EN'])],
        base_price:    [required(), isNumber(), min(0)],
    },

    createCinema: {
        name:     [required(), isString(), minLength(3), maxLength(100)],
        address:  [required(), isString(), minLength(5)],
        province: [required(), isString()],
        phone:    [required(), isString(), minLength(9), maxLength(15)],
    },

    createAuditorium: {
        cinema_id: [required(), isMongoId()],
        name:      [required(), isString(), minLength(1), maxLength(50)],
        capacity:  [required(), isNumber(), min(1), max(1000)],
        format:    [isIn(['Standard', 'IMAX', '4DX', 'ScreenX'])],
    },

    createSeatType: {
        name:  [required(), isString(), minLength(1), maxLength(50)],
        price: [required(), isNumber(), min(0)],
    },

    register: {
        name:     [required(), isString(), minLength(2), maxLength(100)],
        email:    [required(), isEmail()],
        phone:    [required(), isString(), minLength(9), maxLength(15)],
        password: [required(), isString(), minLength(8)],
    },

    login: {
        email:    [required(), isEmail()],
        password: [required(), isString()],
    },

    forgotPassword: {
        email: [required(), isEmail()],
    },

    addAdmin: {
        name:     [required(), isString()],
        email:    [required(), isEmail()],
        password: [required(), isString(), minLength(8)],
    },

    createMovie: {
        title_th:     [required(), isString()],
        title_en:     [required(), isString()],
        genre:        [required(), isString()],
        duration_min: [required(), isNumber(), min(1)],
        start_date:   [required(), isDate()],
        due_date:     [required(), isDate()],
        language:     [isString()],
    },
};

module.exports = {
    validate,
    schemas,
    // Export validators แยกเผื่อใช้ build schema เอง
    required, isString, isNumber, isEmail, isDate,
    minLength, maxLength, min, max, isIn, isMongoId,
};