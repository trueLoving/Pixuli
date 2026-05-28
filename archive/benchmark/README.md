# Pixuli Performance Benchmark

This directory contains performance comparison tests for Pixuli's WASM and
JavaScript image compression functionality, used to verify the performance
advantages of the WASM implementation.

## 🎯 Test Objectives

- **Performance Comparison**: WASM WebP compression vs JavaScript compression
- **Compression Quality**: Compression ratio and effects at different quality
  settings
- **Batch Processing**: Multi-image batch compression performance
- **Memory Usage**: Memory consumption comparison
- **Stability**: Continuous running stability tests

## 📁 Test Files

- `src/simple-compression-bench.ts` - Simplified benchmark test for quick basic
  performance verification
- `src/detailed-bench.ts` - Detailed benchmark test with multiple test scenarios
  and in-depth analysis
- `test-images/` - Test images directory containing PNG and ICO format test
  images

## 🚀 Quick Start

### Install Dependencies

```bash
cd benchmark
pnpm install
```

### Run Tests

#### Simplified Benchmark Test (Recommended)

```bash
pnpm run benchmark:simple
```

#### Detailed Benchmark Test

```bash
pnpm run benchmark:detailed
```

#### Run All Tests

```bash
pnpm run benchmark
```

## 📊 Test Content

### 1. Single Compression Performance Comparison

- **WASM WebP Compression** vs **JavaScript Compression**
- Processing time comparison (milliseconds)
- Operations per second comparison (ops/sec)
- Performance improvement percentage

### 2. Different Quality Settings Test

- Quality range: 60, 70, 80, 90, 95
- Compression ratio comparison
- Processing time comparison
- Quality vs performance trade-off analysis

### 3. Batch Compression Performance Test

- Batch sizes: 2, 5, 10 images
- WASM batch processing vs JavaScript parallel processing
- Batch processing efficiency comparison
- Memory usage

### 4. Compression Effect Comparison

- Original file size
- Compressed file size
- Compression ratio percentage
- Image dimension information

### 5. Memory Usage Comparison

- WASM compression memory usage
- JavaScript compression memory usage
- Memory efficiency comparison

### 6. Stability Test

- Continuous running of 100 tests
- Error rate statistics
- Average processing time
- Performance stability analysis

## 🛠️ Technical Implementation

### Test Framework

- **TinyBench**: High-performance benchmark testing framework
- **TypeScript**: Type-safe test code
- **Node.js**: Server-side test environment

### Test Data

- **Real Images**: Uses test image files from the project
- **Simulated Data**: Uses random data when no test images are available
- **Multiple Formats**: Supports PNG, ICO, and other formats

### WASM Module

- **pixuli-wasm**: Project's self-developed WASM image processing module
- **WebP Compression**: Supports lossy and lossless compression
- **Batch Processing**: Supports multi-image batch compression

## 📈 Expected Results

Based on testing, WASM WebP compression typically has the following advantages
over JavaScript compression:

### ⚡ Performance Advantages

- **Faster Processing Speed** - Typically 2-10x faster
- **Higher Operation Frequency** - Higher ops/sec
- **Lower Latency** - Faster response time

### 📦 Compression Advantages

- **Better Compression Effect** - WebP format has higher compression ratio
- **More Precise Quality Control** - Supports 0-100 quality settings
- **Lossless Compression Support** - Supports lossless compression mode

### 💾 Resource Advantages

- **Lower Memory Usage** - Native code is more efficient
- **Better Stability** - Lower error rate
- **Batch Processing Optimization** - More efficient batch compression

## 📋 Test Metrics

### Performance Metrics

- **Processing Time** (milliseconds)
- **Operation Frequency** (ops/sec)
- **Performance Improvement** (percentage)
- **Average Time** (milliseconds)

### Compression Metrics

- **Compression Ratio** (percentage)
- **File Size** (bytes)
- **Quality Setting** (0-100)
- **Image Dimensions** (width x height)

### Resource Metrics

- **Memory Usage** (MB)
- **Error Rate** (percentage)
- **Stability** (continuous running success rate)

## ⚠️ Notes

1. **Test Environment**: Test results may vary depending on hardware
   configuration
2. **WASM Compilation**: First run may require WASM module compilation
3. **Test Data**: When using real images, will search in the test-images
   directory
4. **Memory Monitoring**: Tests will monitor memory usage
5. **Multiple Runs**: It's recommended to run multiple times for accurate
   performance data
6. **Environment Consistency**: It's recommended to perform comparison tests in
   the same environment

## 🔧 Custom Testing

### Modify Test Parameters

```typescript
// Modify test duration
const bench = new Bench({
  time: 5000, // Run for 5 seconds
  iterations: 20, // Minimum 20 iterations
});

// Modify quality settings
const qualities = [60, 70, 80, 90, 95];

// Modify batch sizes
const batchSizes = [2, 5, 10];
```

### Add New Test Scenarios

```typescript
// Add new compression option test
bench.add('WASM WebP Custom Quality', async () => {
  const result = compressToWebp(imageData, { quality: 85 });
  return result;
});
```

## 📊 Result Analysis

After testing completes, a detailed performance report will be output:

- **Performance Comparison Table** - Intuitive performance data comparison
- **Compression Effect Analysis** - Compression ratio and file size comparison
- **Memory Usage Report** - Memory consumption
- **Stability Statistics** - Error rate and stability analysis
- **Comprehensive Summary** - Overall performance advantages summary

## 🎉 Test Completion

After testing completes, it will display:

- ✅ All advantages of WASM WebP compression
- 📈 Detailed performance metrics
- 🎯 Compression effect comparison
- 💾 Memory usage
- 🔄 Stability test results
