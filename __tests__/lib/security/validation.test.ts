import {
  sanitizeString,
  validateEmail,
  validatePhone,
  validateSSN,
  validateDate,
  validateAmount,
  validateFileName,
  validateFileSize,
  validateFileType,
} from "@/lib/security/validation"

describe("Security Validation", () => {
  describe("sanitizeString", () => {
    it("should remove null bytes", () => {
      expect(sanitizeString("test\0string")).toBe("teststring")
    })

    it("should remove script tags", () => {
      expect(sanitizeString('<script>alert("xss")</script>test')).toBe("test")
    })

    it("should remove event handlers", () => {
      const result = sanitizeString('<div onclick="alert(1)">test</div>')
      expect(result).not.toContain("onclick")
      expect(result).toContain("test")
    })

    it("should trim whitespace", () => {
      expect(sanitizeString("  test  ")).toBe("test")
    })
  })

  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe("test@example.com")
      expect(validateEmail("user.name@example.co.uk")).toBe("user.name@example.co.uk")
    })

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid")).toBeNull()
      expect(validateEmail("@example.com")).toBeNull()
      expect(validateEmail("test@")).toBeNull()
    })

    it("should normalize email to lowercase", () => {
      expect(validateEmail("Test@Example.COM")).toBe("test@example.com")
    })

    it("should reject emails longer than 254 characters", () => {
      const longEmail = "a".repeat(250) + "@example.com"
      expect(validateEmail(longEmail)).toBeNull()
    })
  })

  describe("validatePhone", () => {
    it("should validate 10-digit phone numbers", () => {
      expect(validatePhone("1234567890")).toBe("1234567890")
      expect(validatePhone("(123) 456-7890")).toBe("1234567890")
      expect(validatePhone("123-456-7890")).toBe("1234567890")
    })

    it("should validate 11-digit phone numbers starting with 1", () => {
      expect(validatePhone("11234567890")).toBe("1234567890")
    })

    it("should reject invalid phone numbers", () => {
      expect(validatePhone("123")).toBeNull()
      // Note: validatePhone accepts 11 digits starting with 1 and strips the leading 1
      expect(validatePhone("23456789012")).toBeNull() // 11 digits not starting with 1
    })
  })

  describe("validateSSN", () => {
    it("should validate and format SSN", () => {
      expect(validateSSN("123456789")).toBe("123-45-6789")
      expect(validateSSN("123-45-6789")).toBe("123-45-6789")
    })

    it("should reject invalid SSN", () => {
      expect(validateSSN("12345")).toBeNull()
      expect(validateSSN("1234567890")).toBeNull()
    })
  })

  describe("validateDate", () => {
    it("should validate valid dates", () => {
      const date = validateDate("2024-01-15")
      expect(date).toBeInstanceOf(Date)
      expect(date?.getFullYear()).toBe(2024)
    })

    it("should reject invalid dates", () => {
      expect(validateDate("invalid")).toBeNull()
      expect(validateDate("2024-13-45")).toBeNull()
    })

    it("should reject dates too far in the future", () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 101)
      expect(validateDate(futureDate.toISOString())).toBeNull()
    })
  })

  describe("validateAmount", () => {
    it("should validate numeric amounts", () => {
      expect(validateAmount("100.50")).toBe(100.5)
      expect(validateAmount(100.50)).toBe(100.5)
      expect(validateAmount("$1,000.00")).toBe(1000)
    })

    it("should round to 2 decimal places", () => {
      expect(validateAmount("100.999")).toBe(101)
      expect(validateAmount("100.994")).toBe(100.99)
    })

    it("should reject invalid amounts", () => {
      expect(validateAmount("invalid")).toBeNull()
      expect(validateAmount("")).toBeNull()
    })
  })

  describe("validateFileName", () => {
    it("should validate safe file names", () => {
      expect(validateFileName("document.pdf")).toBe("document.pdf")
      expect(validateFileName("my-file_123.pdf")).toBe("my-file_123.pdf")
    })

    it("should prevent path traversal", () => {
      // validateFileName removes ../ and /, so it returns the cleaned name
      const result1 = validateFileName("../etc/passwd")
      expect(result1).not.toContain("../")
      expect(result1).not.toContain("/")
      
      const result2 = validateFileName("../../file.pdf")
      expect(result2).not.toContain("../")
      expect(result2).not.toContain("/")
    })

    it("should reject dangerous characters", () => {
      expect(validateFileName("file<script>.pdf")).toBeNull()
      expect(validateFileName("file|command.pdf")).toBeNull()
    })

    it("should reject names that are too long", () => {
      const longName = "a".repeat(256) + ".pdf"
      expect(validateFileName(longName)).toBeNull()
    })
  })

  describe("validateFileSize", () => {
    it("should validate file sizes within limit", () => {
      expect(validateFileSize(1024, 2048)).toBe(true)
      expect(validateFileSize(25 * 1024 * 1024, 25 * 1024 * 1024)).toBe(true)
    })

    it("should reject files exceeding limit", () => {
      expect(validateFileSize(30 * 1024 * 1024, 25 * 1024 * 1024)).toBe(false)
    })

    it("should reject invalid sizes", () => {
      expect(validateFileSize(-1)).toBe(false)
      expect(validateFileSize(NaN)).toBe(false)
    })
  })

  describe("validateFileType", () => {
    it("should validate allowed file types", () => {
      expect(validateFileType("document.pdf", "application/pdf", ["application/pdf"])).toBe(true)
      expect(validateFileType("document.PDF", null, ["application/pdf"])).toBe(true)
    })

    it("should reject disallowed file types", () => {
      expect(validateFileType("document.exe", "application/x-msdownload", ["application/pdf"])).toBe(
        false
      )
      expect(validateFileType("script.js", "application/javascript", ["application/pdf"])).toBe(
        false
      )
    })
  })
})
