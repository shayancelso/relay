'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertCircle, Loader2 } from 'lucide-react'
import { parseCSV, autoMapColumns, applyMappingAndValidate, ALL_FIELDS } from '@/lib/csv/parser'
import type { AccountImportRow } from '@/lib/csv/parser'

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'done'

export default function UploadPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<Record<string, string | null>>({})
  const [validData, setValidData] = useState<AccountImportRow[]>([])
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([])
  const [importResult, setImportResult] = useState<{ imported: number; errors: number } | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFile = useCallback(async (f: File) => {
    setFile(f)
    const { headers: h, rows: r } = await parseCSV(f)
    setHeaders(h)
    setRows(r)
    const autoMap = autoMapColumns(h)
    setMapping(autoMap)
    setStep('mapping')
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files[0]
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f)
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function handleMapping() {
    const result = applyMappingAndValidate(rows, mapping)
    setValidData(result.data)
    setErrors(result.errors)
    setStep('preview')
  }

  async function handleImport() {
    setStep('importing')
    try {
      const res = await fetch('/api/accounts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: validData }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportResult({ imported: data.imported, errors: data.errors || 0 })
        setStep('done')
      } else {
        setErrors([{ row: 0, message: data.error || 'Import failed' }])
        setStep('preview')
      }
    } catch {
      setErrors([{ row: 0, message: 'Import failed' }])
      setStep('preview')
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Accounts</h1>
        <p className="text-muted-foreground">Upload a CSV file to import accounts into Relay</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Upload', 'Map Columns', 'Preview', 'Import'].map((label, i) => {
          const stepIndex = ['upload', 'mapping', 'preview', 'importing'].indexOf(step)
          const isActive = i <= stepIndex || step === 'done'
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isActive ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {step === 'done' || i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card>
          <CardContent className="pt-6">
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">Drag & drop your CSV file here</p>
              <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
              <label>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
                <Button variant="outline" asChild><span>Browse Files</span></Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Map Columns
            </CardTitle>
            <CardDescription>
              {file?.name} — {rows.length} rows detected. Map CSV columns to Relay fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {headers.map(header => (
                <div key={header} className="flex items-center gap-4">
                  <span className="w-1/3 text-sm font-medium truncate">{header}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={mapping[header] || 'skip'}
                    onValueChange={val => setMapping(m => ({ ...m, [header]: val === 'skip' ? null : val }))}
                  >
                    <SelectTrigger className="w-2/3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip</SelectItem>
                      {ALL_FIELDS.map(field => (
                        <SelectItem key={field} value={field}>{field}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleMapping}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Import</CardTitle>
            <CardDescription>
              {validData.length} valid rows ready to import
              {errors.length > 0 && <span className="text-destructive"> — {errors.length} errors</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.length > 0 && (
              <div className="rounded-md bg-destructive/10 p-3 space-y-1">
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Row {e.row}: {e.message}
                  </p>
                ))}
                {errors.length > 5 && <p className="text-sm text-destructive">...and {errors.length - 5} more</p>}
              </div>
            )}
            <div className="rounded-md border overflow-auto max-h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ARR</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Owner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validData.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>${row.arr?.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{row.segment}</Badge></TableCell>
                      <TableCell>{row.industry || '—'}</TableCell>
                      <TableCell>{row.owner_email || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button onClick={handleImport} disabled={validData.length === 0}>
                Import {validData.length} Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Importing accounts...</p>
          </CardContent>
        </Card>
      )}

      {/* Done Step */}
      {step === 'done' && importResult && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-medium mb-1">Import Complete</p>
            <p className="text-sm text-muted-foreground mb-6">
              {importResult.imported} accounts imported successfully
            </p>
            <Button onClick={() => router.push('/accounts')}>View Accounts</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
