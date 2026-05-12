/**
 * Validation utility for form inputs
 * Provides centralized validation rules and messages
 */

// Validation rules and messages
export const VALIDATION_RULES = {
  ADDRESS_LINE: {
    minLength: 5,
    maxLength: 255,
    message: 'Địa chỉ phải từ 5 đến 255 ký tự'
  },
  RECIPIENT_NAME: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỵỹđ\s]+$/,
    message: 'Họ tên phải từ 2 đến 100 ký tự và chỉ chứa chữ cái'
  },
  PHONE: {
    pattern: /^(0|\+84)[0-9]{9,10}$/,
    message: 'Số điện thoại phải bắt đầu bằng 0 hoặc +84 và có 10-11 chữ số'
  },
  POSTAL_CODE: {
    pattern: /^[0-9]{5,6}$/,
    message: 'Mã bưu chính phải có 5-6 chữ số'
  },
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Email không hợp lệ'
  },
  USERNAME: {
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Tên tài khoản phải từ 3 đến 50 ký tự và chỉ chứa chữ, số, _ hoặc -'
  },
  PASSWORD: {
    minLength: 6,
    maxLength: 100,
    message: 'Mật khẩu phải từ 6 đến 100 ký tự'
  },
  FULL_NAME: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỵỹđ\s]+$/,
    message: 'Họ tên phải từ 2 đến 100 ký tự và chỉ chứa chữ cái'
  },
  CITY_DISTRICT_WARD: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỵỹđ\s/-]+$/,
    message: 'Trường này phải từ 2 đến 100 ký tự'
  },
  NOTES: {
    maxLength: 500,
    message: 'Ghi chú không được vượt quá 500 ký tự'
  }
};

/**
 * Validate address line
 */
export const validateAddressLine = (value) => {
  if (!value) {
    return { valid: false, message: 'Địa chỉ là bắt buộc' };
  }

  const trimmed = value.trim();
  
  if (trimmed.length < VALIDATION_RULES.ADDRESS_LINE.minLength) {
    return { 
      valid: false, 
      message: `Địa chỉ phải có ít nhất ${VALIDATION_RULES.ADDRESS_LINE.minLength} ký tự` 
    };
  }

  if (trimmed.length > VALIDATION_RULES.ADDRESS_LINE.maxLength) {
    return { 
      valid: false, 
      message: `Địa chỉ không được vượt quá ${VALIDATION_RULES.ADDRESS_LINE.maxLength} ký tự` 
    };
  }

  return { valid: true };
};

/**
 * Validate recipient name
 */
export const validateRecipientName = (value) => {
  if (!value) {
    return { valid: false, message: 'Họ tên là bắt buộc' };
  }

  const trimmed = value.trim();

  if (trimmed.length < VALIDATION_RULES.RECIPIENT_NAME.minLength) {
    return { 
      valid: false, 
      message: `Họ tên phải có ít nhất ${VALIDATION_RULES.RECIPIENT_NAME.minLength} ký tự` 
    };
  }

  if (trimmed.length > VALIDATION_RULES.RECIPIENT_NAME.maxLength) {
    return { 
      valid: false, 
      message: `Họ tên không được vượt quá ${VALIDATION_RULES.RECIPIENT_NAME.maxLength} ký tự` 
    };
  }

  if (!VALIDATION_RULES.RECIPIENT_NAME.pattern.test(trimmed)) {
    return { 
      valid: false, 
      message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' 
    };
  }

  return { valid: true };
};

/**
 * Validate phone number
 */
export const validatePhone = (value) => {
  if (!value) {
    return { valid: false, message: 'Số điện thoại là bắt buộc' };
  }

  const trimmed = value.trim();

  if (!VALIDATION_RULES.PHONE.pattern.test(trimmed)) {
    return { valid: false, message: VALIDATION_RULES.PHONE.message };
  }

  return { valid: true };
};

/**
 * Validate postal code
 */
export const validatePostalCode = (value) => {
  if (!value) {
    return { valid: false, message: 'Mã bưu chính là bắt buộc' };
  }

  const trimmed = value.trim();

  if (!VALIDATION_RULES.POSTAL_CODE.pattern.test(trimmed)) {
    return { valid: false, message: VALIDATION_RULES.POSTAL_CODE.message };
  }

  return { valid: true };
};

/**
 * Validate email
 */
export const validateEmail = (value) => {
  if (!value) {
    return { valid: false, message: 'Email là bắt buộc' };
  }

  const trimmed = value.trim();

  if (!VALIDATION_RULES.EMAIL.pattern.test(trimmed)) {
    return { valid: false, message: VALIDATION_RULES.EMAIL.message };
  }

  return { valid: true };
};

/**
 * Validate username
 */
export const validateUsername = (value) => {
  if (!value) {
    return { valid: false, message: 'Tên tài khoản là bắt buộc' };
  }

  const trimmed = value.trim();

  if (trimmed.length < VALIDATION_RULES.USERNAME.minLength) {
    return { 
      valid: false, 
      message: `Tên tài khoản phải có ít nhất ${VALIDATION_RULES.USERNAME.minLength} ký tự` 
    };
  }

  if (trimmed.length > VALIDATION_RULES.USERNAME.maxLength) {
    return { 
      valid: false, 
      message: `Tên tài khoản không được vượt quá ${VALIDATION_RULES.USERNAME.maxLength} ký tự` 
    };
  }

  if (!VALIDATION_RULES.USERNAME.pattern.test(trimmed)) {
    return { 
      valid: false, 
      message: 'Tên tài khoản chỉ được chứa chữ cái, số, _ hoặc -' 
    };
  }

  return { valid: true };
};

/**
 * Validate password
 */
export const validatePassword = (value) => {
  if (!value) {
    return { valid: false, message: 'Mật khẩu là bắt buộc' };
  }

  if (value.length < VALIDATION_RULES.PASSWORD.minLength) {
    return { 
      valid: false, 
      message: `Mật khẩu phải có ít nhất ${VALIDATION_RULES.PASSWORD.minLength} ký tự` 
    };
  }

  if (value.length > VALIDATION_RULES.PASSWORD.maxLength) {
    return { 
      valid: false, 
      message: `Mật khẩu không được vượt quá ${VALIDATION_RULES.PASSWORD.maxLength} ký tự` 
    };
  }

  return { valid: true };
};

/**
 * Validate full name
 */
export const validateFullName = (value) => {
  if (!value) {
    return { valid: false, message: 'Họ tên là bắt buộc' };
  }

  const trimmed = value.trim();

  if (trimmed.length < VALIDATION_RULES.FULL_NAME.minLength) {
    return { 
      valid: false, 
      message: `Họ tên phải có ít nhất ${VALIDATION_RULES.FULL_NAME.minLength} ký tự` 
    };
  }

  if (trimmed.length > VALIDATION_RULES.FULL_NAME.maxLength) {
    return { 
      valid: false, 
      message: `Họ tên không được vượt quá ${VALIDATION_RULES.FULL_NAME.maxLength} ký tự` 
    };
  }

  if (!VALIDATION_RULES.FULL_NAME.pattern.test(trimmed)) {
    return { 
      valid: false, 
      message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng' 
    };
  }

  return { valid: true };
};

/**
 * Validate city/district/ward
 */
export const validateCityDistrictWard = (value, fieldName = 'Trường này') => {
  if (!value) {
    return { valid: false, message: `${fieldName} là bắt buộc` };
  }

  const trimmed = value.trim();

  if (trimmed.length < VALIDATION_RULES.CITY_DISTRICT_WARD.minLength) {
    return { 
      valid: false, 
      message: `${fieldName} phải có ít nhất ${VALIDATION_RULES.CITY_DISTRICT_WARD.minLength} ký tự` 
    };
  }

  if (trimmed.length > VALIDATION_RULES.CITY_DISTRICT_WARD.maxLength) {
    return { 
      valid: false, 
      message: `${fieldName} không được vượt quá ${VALIDATION_RULES.CITY_DISTRICT_WARD.maxLength} ký tự` 
    };
  }

  if (!VALIDATION_RULES.CITY_DISTRICT_WARD.pattern.test(trimmed)) {
    return { 
      valid: false, 
      message: `${fieldName} chỉ được chứa chữ cái, khoảng trắng, / hoặc -` 
    };
  }

  return { valid: true };
};

/**
 * Validate notes
 */
export const validateNotes = (value) => {
  if (value && value.length > VALIDATION_RULES.NOTES.maxLength) {
    return { 
      valid: false, 
      message: `Ghi chú không được vượt quá ${VALIDATION_RULES.NOTES.maxLength} ký tự` 
    };
  }

  return { valid: true };
};

/**
 * Validate entire address form
 */
export const validateAddressForm = (formData) => {
  const errors = {};

  // Validate each field
  const recipientNameValidation = validateRecipientName(formData.recipientName);
  if (!recipientNameValidation.valid) {
    errors.recipientName = recipientNameValidation.message;
  }

  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message;
  }

  const addressLineValidation = validateAddressLine(formData.addressLine);
  if (!addressLineValidation.valid) {
    errors.addressLine = addressLineValidation.message;
  }

  const wardValidation = validateCityDistrictWard(formData.ward, 'Phường/Xã');
  if (!wardValidation.valid) {
    errors.ward = wardValidation.message;
  }

  const districtValidation = validateCityDistrictWard(formData.district, 'Quận/Huyện');
  if (!districtValidation.valid) {
    errors.district = districtValidation.message;
  }

  const provinceValidation = validateCityDistrictWard(formData.province, 'Tỉnh/Thành phố');
  if (!provinceValidation.valid) {
    errors.province = provinceValidation.message;
  }

  const postalCodeValidation = validatePostalCode(formData.postalCode);
  if (!postalCodeValidation.valid) {
    errors.postalCode = postalCodeValidation.message;
  }

  const notesValidation = validateNotes(formData.notes);
  if (!notesValidation.valid) {
    errors.notes = notesValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate entire profile form
 */
export const validateProfileForm = (formData) => {
  const errors = {};

  const fullNameValidation = validateFullName(formData.fullName);
  if (!fullNameValidation.valid) {
    errors.fullName = fullNameValidation.message;
  }

  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.message;
  }

  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate entire register form
 */
export const validateRegisterForm = (formData) => {
  const errors = {};

  // Only validate username when the form actually provides a non-empty value.
  // The current register UI does not render a username field.
  if (typeof formData.username !== 'undefined' && String(formData.username).trim() !== '') {
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.valid) {
      errors.username = usernameValidation.message;
    }
  }

  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.message;
  }

  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.message;
  }

  const fullNameValidation = validateFullName(formData.fullName);
  if (!fullNameValidation.valid) {
    errors.fullName = fullNameValidation.message;
  }

  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.valid) {
    errors.phone = phoneValidation.message;
  }

  if (!formData.terms) {
    errors.terms = 'Vui lòng đồng ý với điều khoản sử dụng';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate entire login form
 */
export const validateLoginForm = (formData) => {
  const errors = {};

  if (!formData.username) {
    errors.username = 'Tài khoản là bắt buộc';
  }

  if (!formData.password) {
    errors.password = 'Mật khẩu là bắt buộc';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
