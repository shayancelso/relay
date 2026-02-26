import Papa from 'papaparse'
import { z } from 'zod/v4'

export const accountImportSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  arr: z.coerce.number().min(0).optional().default(0),
  industry: z.string().optional(),
  segment: z.enum(['enterprise', 'mid_market', 'smb']).optional().default('smb'),
  health_score: z.coerce.number().min(0).max(100).optional().default(50),
  geography: z.string().optional(),
  renewal_date: z.string().optional(),
  external_id: z.string().optional(),
  owner_email: z.string().email().optional(),
})

export type AccountImportRow = z.infer<typeof accountImportSchema>

export interface ParseResult {
  data: AccountImportRow[]
  errors: { row: number; message: string }[]
  headers: string[]
}

export interface ColumnMapping {
  [csvHeader: string]: string | null
}

const REQUIRED_FIELDS = ['name']
const OPTIONAL_FIELDS = ['arr', 'industry', 'segment', 'health_score', 'geography', 'renewal_date', 'external_id', 'owner_email']
export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

export function parseCSV(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, string>[],
        })
      },
      error(err) {
        reject(err)
      },
    })
  })
}

export function autoMapColumns(csvHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normalizedMap: Record<string, string> = {
    'account name': 'name',
    'company': 'name',
    'company name': 'name',
    'name': 'name',
    'arr': 'arr',
    'annual recurring revenue': 'arr',
    'revenue': 'arr',
    'mrr': 'arr',
    'industry': 'industry',
    'vertical': 'industry',
    'segment': 'segment',
    'tier': 'segment',
    'health': 'health_score',
    'health score': 'health_score',
    'health_score': 'health_score',
    'geo': 'geography',
    'geography': 'geography',
    'region': 'geography',
    'location': 'geography',
    'renewal': 'renewal_date',
    'renewal date': 'renewal_date',
    'renewal_date': 'renewal_date',
    'crm id': 'external_id',
    'external id': 'external_id',
    'external_id': 'external_id',
    'salesforce id': 'external_id',
    'owner': 'owner_email',
    'owner email': 'owner_email',
    'owner_email': 'owner_email',
    'rep email': 'owner_email',
    'account owner': 'owner_email',
    'am email': 'owner_email',
  }

  for (const header of csvHeaders) {
    const normalized = header.toLowerCase().trim()
    if (normalizedMap[normalized]) {
      mapping[header] = normalizedMap[normalized]
    }
  }

  return mapping
}

export function applyMappingAndValidate(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): ParseResult {
  const data: AccountImportRow[] = []
  const errors: { row: number; message: string }[] = []

  // Invert mapping: targetField -> csvHeader
  const fieldToHeader: Record<string, string> = {}
  for (const [csvHeader, field] of Object.entries(mapping)) {
    if (field) fieldToHeader[field] = csvHeader
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const mapped: Record<string, unknown> = {}

    for (const [field, csvHeader] of Object.entries(fieldToHeader)) {
      mapped[field] = row[csvHeader]?.trim() || undefined
    }

    const result = accountImportSchema.safeParse(mapped)
    if (result.success) {
      data.push(result.data)
    } else {
      const messages = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
      errors.push({ row: i + 2, message: messages.join('; ') })
    }
  }

  return { data, errors, headers: Object.keys(mapping) }
}
