# Third-Party Notices

This project uses the following third-party data and resources:

---

## ISO 4217 Currency Codes

**Source:** International Organization for Standardization (ISO)  
**License:** Public Domain  
**URL:** https://www.iso.org/iso-4217-currency-codes.html

ISO 4217 currency codes are international standards published by ISO. The standard defines three-letter alphabetic codes and three-digit numeric codes for currencies.

**Usage in this project:**
- File: `src/data/iso4217.json`
- Contains: 181 active currency codes
- Purpose: Official currency code validation and detection

---

## Unicode CLDR (Common Locale Data Repository)

**Source:** Unicode Consortium  
**License:** Unicode License  
**URL:** https://cldr.unicode.org/

The Unicode CLDR provides key building blocks for software to support the world's languages, with the largest and most extensive standard repository of locale data available.

**License Text:** https://www.unicode.org/license.txt

**Usage in this project:**
- Currency symbol mappings
- Regional formatting conventions
- Alternative currency representations

---

## Real-World Test Data

**Source:** Manual collection from public e-commerce websites  
**License:** Fair use for testing purposes

Test data was collected from publicly accessible price information on various e-commerce platforms across 40+ countries, including:
- Amazon (multiple regions)
- eBay
- AliExpress
- Mercado Libre
- Flipkart
- Tokopedia
- Regional retailers

**Usage in this project:**
- File: `test/integration/real-world-html.test.ts`
- Purpose: Validation of real-world price parsing accuracy
- Note: Only price format patterns are used, no proprietary data is included

---

## Development Dependencies

This project uses various open-source development tools under their respective licenses:
- TypeScript (Apache-2.0)
- Vitest (MIT)
- ESLint (MIT)
- Prettier (MIT)

For a complete list of development dependencies and their licenses, see `package.json` and run:
```bash
npm list --all
```

---

## Acknowledgments

Special thanks to:
- The Unicode Consortium for maintaining CLDR data
- ISO for publishing currency standards
- The open-source community for development tools
- Contributors who provided real-world test cases

---

## Disclaimer

This project is provided "as is" without warranty of any kind. While we strive for accuracy, currency data and formatting conventions may change over time. Users are responsible for validating the accuracy of parsed results in their specific use cases.

---

**Last Updated:** January 2, 2026
