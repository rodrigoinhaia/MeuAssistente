'use client'

import { RiArrowDownSLine } from 'react-icons/ri'

interface CountryCode {
  code: string
  country: string
  flag: string
}

const countryCodes: CountryCode[] = [
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', country: 'Canadá', flag: '🇨🇦' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colômbia', flag: '🇨🇴' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+593', country: 'Equador', flag: '🇪🇨' },
  { code: '+595', country: 'Paraguai', flag: '🇵🇾' },
  { code: '+598', country: 'Uruguai', flag: '🇺🇾' },
  { code: '+591', country: 'Bolívia', flag: '🇧🇴' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+7', country: 'Rússia', flag: '🇷🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japão', flag: '🇯🇵' },
  { code: '+82', country: 'Coreia do Sul', flag: '🇰🇷' },
  { code: '+91', country: 'Índia', flag: '🇮🇳' },
  { code: '+61', country: 'Austrália', flag: '🇦🇺' },
  { code: '+27', country: 'África do Sul', flag: '🇿🇦' },
]

interface CountryCodeSelectProps {
  value: string
  onChange: (code: string) => void
  className?: string
  disabled?: boolean
}

export default function CountryCodeSelect({
  value,
  onChange,
  className = '',
  disabled = false,
}: CountryCodeSelectProps) {
  const selectedCountry = countryCodes.find(c => c.code === value) || countryCodes[0]

  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`appearance-none w-full px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:ring-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          className.includes('bg-white/5') 
            ? 'bg-white/5 border border-gray-600 text-white focus:border-cyan-400 focus:ring-cyan-400/20' 
            : 'bg-slate-50 border border-slate-200 text-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'
        }`}
        style={{ paddingRight: '2rem' }}
      >
        {countryCodes.map((country, index) => (
          <option key={`${country.code}-${index}`} value={country.code}>
            {country.flag} {country.code} {country.country}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <RiArrowDownSLine className="w-5 h-5 text-slate-400" />
      </div>
    </div>
  )
}

// Função utilitária para extrair código do país de um número completo
export function extractCountryCode(phoneNumber: string): { code: string; number: string } {
  // Remove caracteres não numéricos
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Verifica se começa com código do país conhecido
  for (const country of countryCodes) {
    const codeDigits = country.code.replace('+', '')
    if (digits.startsWith(codeDigits)) {
      return {
        code: country.code,
        number: digits.substring(codeDigits.length),
      }
    }
  }
  
  // Se não encontrar, assume Brasil (+55) se tiver 13 dígitos ou mais
  if (digits.length >= 13 && digits.startsWith('55')) {
    return {
      code: '+55',
      number: digits.substring(2),
    }
  }
  
  // Se tiver 11 dígitos ou menos, assume Brasil sem código
  return {
    code: '+55',
    number: digits,
  }
}

// Função utilitária para combinar código do país com número
export function combinePhoneNumber(countryCode: string, phoneNumber: string): string {
  // Remove caracteres não numéricos do número
  const digits = phoneNumber.replace(/\D/g, '')
  
  // Remove o + do código do país
  const codeDigits = countryCode.replace('+', '')
  
  // Se o número já começa com o código do país, remove
  if (digits.startsWith(codeDigits)) {
    return codeDigits + digits.substring(codeDigits.length)
  }
  
  // Combina código do país com número
  return codeDigits + digits
}

