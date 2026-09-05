import { AsYouType, Metadata, isSupportedCountry, parsePhoneNumberFromString, validatePhoneNumberLength, type CountryCode } from "libphonenumber-js/max";

// Country/calling-code facts from Google's libphonenumber metadata, checked 2026-09-04.
// https://github.com/google/libphonenumber/blob/master/resources/PhoneNumberMetadata.xml
// English region names resolved once, not at render time (avoids locale hydration differences).
export const phoneCountries = [
  {"id":"AF","name":"Afghanistan","code":"93"},
  {"id":"AX","name":"Åland Islands","code":"358"},
  {"id":"AL","name":"Albania","code":"355"},
  {"id":"DZ","name":"Algeria","code":"213"},
  {"id":"AS","name":"American Samoa","code":"1"},
  {"id":"AD","name":"Andorra","code":"376"},
  {"id":"AO","name":"Angola","code":"244"},
  {"id":"AI","name":"Anguilla","code":"1"},
  {"id":"AG","name":"Antigua & Barbuda","code":"1"},
  {"id":"AR","name":"Argentina","code":"54"},
  {"id":"AM","name":"Armenia","code":"374"},
  {"id":"AW","name":"Aruba","code":"297"},
  {"id":"AC","name":"Ascension Island","code":"247"},
  {"id":"AU","name":"Australia","code":"61"},
  {"id":"AT","name":"Austria","code":"43"},
  {"id":"AZ","name":"Azerbaijan","code":"994"},
  {"id":"BS","name":"Bahamas","code":"1"},
  {"id":"BH","name":"Bahrain","code":"973"},
  {"id":"BD","name":"Bangladesh","code":"880"},
  {"id":"BB","name":"Barbados","code":"1"},
  {"id":"BY","name":"Belarus","code":"375"},
  {"id":"BE","name":"Belgium","code":"32"},
  {"id":"BZ","name":"Belize","code":"501"},
  {"id":"BJ","name":"Benin","code":"229"},
  {"id":"BM","name":"Bermuda","code":"1"},
  {"id":"BT","name":"Bhutan","code":"975"},
  {"id":"BO","name":"Bolivia","code":"591"},
  {"id":"BA","name":"Bosnia & Herzegovina","code":"387"},
  {"id":"BW","name":"Botswana","code":"267"},
  {"id":"BR","name":"Brazil","code":"55"},
  {"id":"IO","name":"British Indian Ocean Territory","code":"246"},
  {"id":"VG","name":"British Virgin Islands","code":"1"},
  {"id":"BN","name":"Brunei","code":"673"},
  {"id":"BG","name":"Bulgaria","code":"359"},
  {"id":"BF","name":"Burkina Faso","code":"226"},
  {"id":"BI","name":"Burundi","code":"257"},
  {"id":"KH","name":"Cambodia","code":"855"},
  {"id":"CM","name":"Cameroon","code":"237"},
  {"id":"CA","name":"Canada","code":"1"},
  {"id":"CV","name":"Cape Verde","code":"238"},
  {"id":"BQ","name":"Caribbean Netherlands","code":"599"},
  {"id":"KY","name":"Cayman Islands","code":"1"},
  {"id":"CF","name":"Central African Republic","code":"236"},
  {"id":"TD","name":"Chad","code":"235"},
  {"id":"CL","name":"Chile","code":"56"},
  {"id":"CN","name":"China","code":"86"},
  {"id":"CX","name":"Christmas Island","code":"61"},
  {"id":"CC","name":"Cocos (Keeling) Islands","code":"61"},
  {"id":"CO","name":"Colombia","code":"57"},
  {"id":"KM","name":"Comoros","code":"269"},
  {"id":"CG","name":"Congo - Brazzaville","code":"242"},
  {"id":"CD","name":"Congo - Kinshasa","code":"243"},
  {"id":"CK","name":"Cook Islands","code":"682"},
  {"id":"CR","name":"Costa Rica","code":"506"},
  {"id":"CI","name":"Côte d’Ivoire","code":"225"},
  {"id":"HR","name":"Croatia","code":"385"},
  {"id":"CU","name":"Cuba","code":"53"},
  {"id":"CW","name":"Curaçao","code":"599"},
  {"id":"CY","name":"Cyprus","code":"357"},
  {"id":"CZ","name":"Czechia","code":"420"},
  {"id":"DK","name":"Denmark","code":"45"},
  {"id":"DJ","name":"Djibouti","code":"253"},
  {"id":"DM","name":"Dominica","code":"1"},
  {"id":"DO","name":"Dominican Republic","code":"1"},
  {"id":"EC","name":"Ecuador","code":"593"},
  {"id":"EG","name":"Egypt","code":"20"},
  {"id":"SV","name":"El Salvador","code":"503"},
  {"id":"GQ","name":"Equatorial Guinea","code":"240"},
  {"id":"ER","name":"Eritrea","code":"291"},
  {"id":"EE","name":"Estonia","code":"372"},
  {"id":"SZ","name":"Eswatini","code":"268"},
  {"id":"ET","name":"Ethiopia","code":"251"},
  {"id":"FK","name":"Falkland Islands","code":"500"},
  {"id":"FO","name":"Faroe Islands","code":"298"},
  {"id":"FJ","name":"Fiji","code":"679"},
  {"id":"FI","name":"Finland","code":"358"},
  {"id":"FR","name":"France","code":"33"},
  {"id":"GF","name":"French Guiana","code":"594"},
  {"id":"PF","name":"French Polynesia","code":"689"},
  {"id":"GA","name":"Gabon","code":"241"},
  {"id":"GM","name":"Gambia","code":"220"},
  {"id":"GE","name":"Georgia","code":"995"},
  {"id":"DE","name":"Germany","code":"49"},
  {"id":"GH","name":"Ghana","code":"233"},
  {"id":"GI","name":"Gibraltar","code":"350"},
  {"id":"GR","name":"Greece","code":"30"},
  {"id":"GL","name":"Greenland","code":"299"},
  {"id":"GD","name":"Grenada","code":"1"},
  {"id":"GP","name":"Guadeloupe","code":"590"},
  {"id":"GU","name":"Guam","code":"1"},
  {"id":"GT","name":"Guatemala","code":"502"},
  {"id":"GG","name":"Guernsey","code":"44"},
  {"id":"GN","name":"Guinea","code":"224"},
  {"id":"GW","name":"Guinea-Bissau","code":"245"},
  {"id":"GY","name":"Guyana","code":"592"},
  {"id":"HT","name":"Haiti","code":"509"},
  {"id":"HN","name":"Honduras","code":"504"},
  {"id":"HK","name":"Hong Kong SAR China","code":"852"},
  {"id":"HU","name":"Hungary","code":"36"},
  {"id":"IS","name":"Iceland","code":"354"},
  {"id":"IN","name":"India","code":"91"},
  {"id":"ID","name":"Indonesia","code":"62"},
  {"id":"IR","name":"Iran","code":"98"},
  {"id":"IQ","name":"Iraq","code":"964"},
  {"id":"IE","name":"Ireland","code":"353"},
  {"id":"IM","name":"Isle of Man","code":"44"},
  {"id":"IL","name":"Israel","code":"972"},
  {"id":"IT","name":"Italy","code":"39"},
  {"id":"JM","name":"Jamaica","code":"1"},
  {"id":"JP","name":"Japan","code":"81"},
  {"id":"JE","name":"Jersey","code":"44"},
  {"id":"JO","name":"Jordan","code":"962"},
  {"id":"KZ","name":"Kazakhstan","code":"7"},
  {"id":"KE","name":"Kenya","code":"254"},
  {"id":"KI","name":"Kiribati","code":"686"},
  {"id":"XK","name":"Kosovo","code":"383"},
  {"id":"KW","name":"Kuwait","code":"965"},
  {"id":"KG","name":"Kyrgyzstan","code":"996"},
  {"id":"LA","name":"Laos","code":"856"},
  {"id":"LV","name":"Latvia","code":"371"},
  {"id":"LB","name":"Lebanon","code":"961"},
  {"id":"LS","name":"Lesotho","code":"266"},
  {"id":"LR","name":"Liberia","code":"231"},
  {"id":"LY","name":"Libya","code":"218"},
  {"id":"LI","name":"Liechtenstein","code":"423"},
  {"id":"LT","name":"Lithuania","code":"370"},
  {"id":"LU","name":"Luxembourg","code":"352"},
  {"id":"MO","name":"Macao SAR China","code":"853"},
  {"id":"MG","name":"Madagascar","code":"261"},
  {"id":"MW","name":"Malawi","code":"265"},
  {"id":"MY","name":"Malaysia","code":"60"},
  {"id":"MV","name":"Maldives","code":"960"},
  {"id":"ML","name":"Mali","code":"223"},
  {"id":"MT","name":"Malta","code":"356"},
  {"id":"MH","name":"Marshall Islands","code":"692"},
  {"id":"MQ","name":"Martinique","code":"596"},
  {"id":"MR","name":"Mauritania","code":"222"},
  {"id":"MU","name":"Mauritius","code":"230"},
  {"id":"YT","name":"Mayotte","code":"262"},
  {"id":"MX","name":"Mexico","code":"52"},
  {"id":"FM","name":"Micronesia","code":"691"},
  {"id":"MD","name":"Moldova","code":"373"},
  {"id":"MC","name":"Monaco","code":"377"},
  {"id":"MN","name":"Mongolia","code":"976"},
  {"id":"ME","name":"Montenegro","code":"382"},
  {"id":"MS","name":"Montserrat","code":"1"},
  {"id":"MA","name":"Morocco","code":"212"},
  {"id":"MZ","name":"Mozambique","code":"258"},
  {"id":"MM","name":"Myanmar (Burma)","code":"95"},
  {"id":"NA","name":"Namibia","code":"264"},
  {"id":"NR","name":"Nauru","code":"674"},
  {"id":"NP","name":"Nepal","code":"977"},
  {"id":"NL","name":"Netherlands","code":"31"},
  {"id":"NC","name":"New Caledonia","code":"687"},
  {"id":"NZ","name":"New Zealand","code":"64"},
  {"id":"NI","name":"Nicaragua","code":"505"},
  {"id":"NE","name":"Niger","code":"227"},
  {"id":"NG","name":"Nigeria","code":"234"},
  {"id":"NU","name":"Niue","code":"683"},
  {"id":"NF","name":"Norfolk Island","code":"672"},
  {"id":"KP","name":"North Korea","code":"850"},
  {"id":"MK","name":"North Macedonia","code":"389"},
  {"id":"MP","name":"Northern Mariana Islands","code":"1"},
  {"id":"NO","name":"Norway","code":"47"},
  {"id":"OM","name":"Oman","code":"968"},
  {"id":"PK","name":"Pakistan","code":"92"},
  {"id":"PW","name":"Palau","code":"680"},
  {"id":"PS","name":"Palestinian Territories","code":"970"},
  {"id":"PA","name":"Panama","code":"507"},
  {"id":"PG","name":"Papua New Guinea","code":"675"},
  {"id":"PY","name":"Paraguay","code":"595"},
  {"id":"PE","name":"Peru","code":"51"},
  {"id":"PH","name":"Philippines","code":"63"},
  {"id":"PL","name":"Poland","code":"48"},
  {"id":"PT","name":"Portugal","code":"351"},
  {"id":"PR","name":"Puerto Rico","code":"1"},
  {"id":"QA","name":"Qatar","code":"974"},
  {"id":"RE","name":"Réunion","code":"262"},
  {"id":"RO","name":"Romania","code":"40"},
  {"id":"RU","name":"Russia","code":"7"},
  {"id":"RW","name":"Rwanda","code":"250"},
  {"id":"WS","name":"Samoa","code":"685"},
  {"id":"SM","name":"San Marino","code":"378"},
  {"id":"ST","name":"São Tomé & Príncipe","code":"239"},
  {"id":"SA","name":"Saudi Arabia","code":"966"},
  {"id":"SN","name":"Senegal","code":"221"},
  {"id":"RS","name":"Serbia","code":"381"},
  {"id":"SC","name":"Seychelles","code":"248"},
  {"id":"SL","name":"Sierra Leone","code":"232"},
  {"id":"SG","name":"Singapore","code":"65"},
  {"id":"SX","name":"Sint Maarten","code":"1"},
  {"id":"SK","name":"Slovakia","code":"421"},
  {"id":"SI","name":"Slovenia","code":"386"},
  {"id":"SB","name":"Solomon Islands","code":"677"},
  {"id":"SO","name":"Somalia","code":"252"},
  {"id":"ZA","name":"South Africa","code":"27"},
  {"id":"KR","name":"South Korea","code":"82"},
  {"id":"SS","name":"South Sudan","code":"211"},
  {"id":"ES","name":"Spain","code":"34"},
  {"id":"LK","name":"Sri Lanka","code":"94"},
  {"id":"BL","name":"St. Barthélemy","code":"590"},
  {"id":"SH","name":"St. Helena","code":"290"},
  {"id":"KN","name":"St. Kitts & Nevis","code":"1"},
  {"id":"LC","name":"St. Lucia","code":"1"},
  {"id":"MF","name":"St. Martin","code":"590"},
  {"id":"PM","name":"St. Pierre & Miquelon","code":"508"},
  {"id":"VC","name":"St. Vincent & Grenadines","code":"1"},
  {"id":"SD","name":"Sudan","code":"249"},
  {"id":"SR","name":"Suriname","code":"597"},
  {"id":"SJ","name":"Svalbard & Jan Mayen","code":"47"},
  {"id":"SE","name":"Sweden","code":"46"},
  {"id":"CH","name":"Switzerland","code":"41"},
  {"id":"SY","name":"Syria","code":"963"},
  {"id":"TW","name":"Taiwan","code":"886"},
  {"id":"TJ","name":"Tajikistan","code":"992"},
  {"id":"TZ","name":"Tanzania","code":"255"},
  {"id":"TH","name":"Thailand","code":"66"},
  {"id":"TL","name":"Timor-Leste","code":"670"},
  {"id":"TG","name":"Togo","code":"228"},
  {"id":"TK","name":"Tokelau","code":"690"},
  {"id":"TO","name":"Tonga","code":"676"},
  {"id":"TT","name":"Trinidad & Tobago","code":"1"},
  {"id":"TA","name":"Tristan da Cunha","code":"290"},
  {"id":"TN","name":"Tunisia","code":"216"},
  {"id":"TR","name":"Türkiye","code":"90"},
  {"id":"TM","name":"Turkmenistan","code":"993"},
  {"id":"TC","name":"Turks & Caicos Islands","code":"1"},
  {"id":"TV","name":"Tuvalu","code":"688"},
  {"id":"VI","name":"U.S. Virgin Islands","code":"1"},
  {"id":"UG","name":"Uganda","code":"256"},
  {"id":"UA","name":"Ukraine","code":"380"},
  {"id":"AE","name":"United Arab Emirates","code":"971"},
  {"id":"GB","name":"United Kingdom","code":"44"},
  {"id":"US","name":"United States","code":"1"},
  {"id":"UY","name":"Uruguay","code":"598"},
  {"id":"UZ","name":"Uzbekistan","code":"998"},
  {"id":"VU","name":"Vanuatu","code":"678"},
  {"id":"VA","name":"Vatican City","code":"39"},
  {"id":"VE","name":"Venezuela","code":"58"},
  {"id":"VN","name":"Vietnam","code":"84"},
  {"id":"WF","name":"Wallis & Futuna","code":"681"},
  {"id":"EH","name":"Western Sahara","code":"212"},
  {"id":"YE","name":"Yemen","code":"967"},
  {"id":"ZM","name":"Zambia","code":"260"},
  {"id":"ZW","name":"Zimbabwe","code":"263"},
] as const;
export type PhoneFormat = typeof phoneCountries[number]["id"];
const supported = (value: unknown): value is CountryCode => typeof value === "string" && isSupportedCountry(value);
const internationalPrefix = (value: string) => value.trim().replace(/^00/, "+");

export function phoneFormatFor(phone: string): PhoneFormat {
  const number = parsePhoneNumberFromString(internationalPrefix(phone), { defaultCountry: "IE", extract: false });
  return (number?.country as PhoneFormat | undefined) ?? "IE";
}

// Numbering-plan validation only; this does not establish ownership or reachability.
export function normalisePhone(value: string, format: unknown): string | null {
  if (!supported(format) || value.length > 32 || !/^\+?[\d\s()-]+$/.test(value.trim())) return null;
  const phone = parsePhoneNumberFromString(internationalPrefix(value), { defaultCountry: format, extract: false });
  return phone && !phone.ext && phone.country === format && phone.isValid() ? phone.number : null;
}

export function formatPhoneInput(value: string, format: PhoneFormat): string {
  // Do not discard letters/extensions or turn an invalid paste into a valid number.
  if (value.length > 32 || !supported(format) || !/^\+?[\d\s()-]*$/.test(value.trim())) return value;
  if (/^(?:\+|00)/.test(value.trim())) {
    const number = parsePhoneNumberFromString(internationalPrefix(value), { defaultCountry: format, extract: false });
    // The dropdown already shows the calling code. Only remove a prefix once
    // the complete number is valid and belongs to the selected country.
    // Preserve incomplete, invalid and mismatched input for correction.
    return number?.isValid() && number.country === format ? number.formatNational() : value;
  }
  return new AsYouType(format).input(value);
}

export function phoneTooLong(value: string, format: PhoneFormat): boolean {
  return supported(format) && validatePhoneNumberLength(internationalPrefix(value), format) === "TOO_LONG";
}

export function phoneEditFits(value: string, format: PhoneFormat): boolean {
  if (!supported(format) || value.length > 32 || phoneTooLong(value, format)) return false;
  const metadata = new Metadata();
  metadata.selectNumberingPlan(format);
  const lengths = metadata.numberingPlan?.possibleLengths();
  if (!lengths?.length) return false;
  const formatter = new AsYouType(format);
  formatter.input(value);
  // National significant digits exclude the calling/trunk prefix. This also
  // bounds malformed input for which full number parsing cannot validate length.
  const digits = formatter.getNumber()?.nationalNumber ?? value.replace(/\D/g, "");
  return digits.length <= Math.max(...lengths);
}

export function phoneValidationMessage(value: string, format: PhoneFormat): string {
  if (!value.trim()) return "Enter a phone number.";
  if (phoneTooLong(value, format)) return "Too many digits for this country. Check the number; no digits have been removed.";
  return normalisePhone(value, format) ? "" : "Enter a valid number for the selected country. Check its length and prefix; extensions are not supported.";
}

// Keep the draft and caret stable: formatting is for initial display, not edits.
// Allow deletion even when correcting a legacy value above the current limit.
export function acceptPhoneEdit(previous: string, next: string, format: PhoneFormat): string | null {
  const removing = next.replace(/\D/g, "").length < previous.replace(/\D/g, "").length;
  return removing || phoneEditFits(next, format) ? next : null;
}
