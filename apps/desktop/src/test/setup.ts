import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-object-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// Mock Image constructor
global.Image = class {
  width = 0
  height = 0
  naturalWidth = 0
  naturalHeight = 0
  crossOrigin = ''
  src = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor() {
    // Simulate async loading
    setTimeout(() => {
      if (this.onload) {
        this.width = 800
        this.height = 600
        this.naturalWidth = 800
        this.naturalHeight = 600
        this.onload()
      }
    }, 0)
  }
} as any

// Mock File constructor
global.File = class File {
  name: string
  type: string
  size: number

  constructor(chunks: any[], filename: string, options: any = {}) {
    this.name = filename
    this.type = options.type || 'image/jpeg'
    this.size = options.size || 1024
  }
} as any

// Mock Blob constructor
global.Blob = class Blob {
  size: number
  type: string

  constructor(chunks: any[], options: any = {}) {
    this.size = chunks.reduce((total, chunk) => total + chunk.length, 0)
    this.type = options.type || ''
  }
} as any
