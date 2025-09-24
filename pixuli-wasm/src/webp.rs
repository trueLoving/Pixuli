//! WebP 图片压缩模块
//! 
//! 提供图片的 WebP 格式压缩功能，支持单张和批量压缩

use napi_derive::napi;
use image::GenericImageView;
use webp::{Encoder, PixelLayout};
use napi::Error as NapiError;

/// WebP压缩配置
#[napi(object)]
#[derive(Clone)]
pub struct WebPCompressOptions {
  /// 压缩质量 (0-100)
  pub quality: Option<u8>,
  /// 是否使用无损压缩
  pub lossless: Option<bool>,
}

/// WebP压缩结果
#[napi(object)]
pub struct WebPCompressResult {
  /// 压缩后的数据
  pub data: Vec<u8>,
  /// 原始大小
  pub original_size: u32,
  /// 压缩后大小
  pub compressed_size: u32,
  /// 压缩率 (0-1)
  pub compression_ratio: f64,
  /// 压缩后的宽度
  pub width: u32,
  /// 压缩后的高度
  pub height: u32,
}

/// 压缩图片为WebP格式
#[napi]
pub fn compress_to_webp(
  image_data: Vec<u8>,
  options: Option<WebPCompressOptions>,
) -> Result<WebPCompressResult, NapiError> {
  // 解析图片
  let img = image::load_from_memory(&image_data)
    .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

  let (width, height) = img.dimensions();
  let original_size = image_data.len() as u32;

  // 获取选项
  let opts = options.unwrap_or(WebPCompressOptions {
    quality: Some(80),
    lossless: Some(false),
  });

  let quality = opts.quality.unwrap_or(80);
  let lossless = opts.lossless.unwrap_or(false);

  // 转换为RGB格式
  let rgb_img = img.to_rgb8();
  let (img_width, img_height) = rgb_img.dimensions();

  // 创建WebP编码器
  let encoder = if lossless {
    Encoder::new(&rgb_img, PixelLayout::Rgb, img_width, img_height).encode_lossless()
  } else {
    Encoder::new(&rgb_img, PixelLayout::Rgb, img_width, img_height).encode(quality as f32)
  };

  let webp_data = encoder.to_vec();
  let compressed_size = webp_data.len() as u32;
  let compression_ratio = compressed_size as f64 / original_size as f64;

  Ok(WebPCompressResult {
    data: webp_data,
    original_size,
    compressed_size,
    compression_ratio,
    width,
    height,
  })
}

/// 批量压缩图片为WebP格式
#[napi]
pub fn batch_compress_to_webp(
  images_data: Vec<Vec<u8>>,
  options: Option<WebPCompressOptions>,
) -> Result<Vec<WebPCompressResult>, NapiError> {
  let mut results = Vec::new();
  
  for image_data in images_data {
    match compress_to_webp(image_data, options.clone()) {
      Ok(result) => results.push(result),
      Err(e) => return Err(NapiError::new(napi::Status::GenericFailure, format!("Batch compression failed: {}", e))),
    }
  }
  
  Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    /// 生成测试用的PNG图片
    fn generate_test_png(width: u32, height: u32) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut img: RgbImage = ImageBuffer::new(width, height);
        
        // 生成渐变图片
        for (x, y, pixel) in img.enumerate_pixels_mut() {
            let r = (x * 255 / width) as u8;
            let g = (y * 255 / height) as u8;
            let b = ((x + y) * 255 / (width + height)) as u8;
            *pixel = Rgb([r, g, b]);
        }
        
        // 保存到内存
        let mut buffer = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Png)?;
        
        Ok(buffer)
    }

    /// 生成测试用的JPEG图片
    fn generate_test_jpeg(width: u32, height: u32, quality: u8) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut img: RgbImage = ImageBuffer::new(width, height);
        
        // 生成随机噪点图片
        for (x, y, pixel) in img.enumerate_pixels_mut() {
            let r = ((x * 7 + y * 11) % 256) as u8;
            let g = ((x * 13 + y * 17) % 256) as u8;
            let b = ((x * 19 + y * 23) % 256) as u8;
            *pixel = Rgb([r, g, b]);
        }
        
        // 保存到内存
        let mut buffer = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Jpeg(quality))?;
        
        Ok(buffer)
    }

    /// 生成纯色测试图片
    fn generate_solid_color_image(width: u32, height: u32, color: Rgb<u8>) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let img: RgbImage = ImageBuffer::from_pixel(width, height, color);
        
        let mut buffer = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buffer), image::ImageOutputFormat::Png)?;
        
        Ok(buffer)
    }

    #[test]
    fn test_compress_to_webp_basic() {
        // 测试基本的WebP压缩功能
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        let result = compress_to_webp(png_data.clone(), None).expect("Failed to compress PNG to WebP");
        
        // 验证压缩结果的基本属性
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert_eq!(result.original_size, png_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(result.compression_ratio > 0.0);
        assert!(result.compression_ratio <= 1.0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_compress_to_webp_with_custom_quality() {
        // 测试自定义质量设置
        let png_data = generate_test_png(150, 150).expect("Failed to generate test PNG");
        
        let options = WebPCompressOptions {
            quality: Some(60),
            lossless: Some(false),
        };
        
        let result = compress_to_webp(png_data.clone(), Some(options)).expect("Failed to compress with custom quality");
        
        // 验证结果
        assert_eq!(result.width, 150);
        assert_eq!(result.height, 150);
        assert_eq!(result.original_size, png_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_compress_to_webp_lossless_mode() {
        // 测试无损压缩模式
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        let options = WebPCompressOptions {
            quality: None,
            lossless: Some(true),
        };
        
        let result = compress_to_webp(png_data.clone(), Some(options)).expect("Failed to compress in lossless mode");
        
        // 验证结果
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert_eq!(result.original_size, png_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_compress_to_webp_different_formats() {
        // 测试不同格式的图片压缩
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        let jpeg_data = generate_test_jpeg(100, 100, 85).expect("Failed to generate test JPEG");
        
        // 测试PNG压缩
        let png_result = compress_to_webp(png_data.clone(), None).expect("Failed to compress PNG");
        assert_eq!(png_result.width, 100);
        assert_eq!(png_result.height, 100);
        assert_eq!(png_result.original_size, png_data.len() as u32);
        
        // 测试JPEG压缩
        let jpeg_result = compress_to_webp(jpeg_data.clone(), None).expect("Failed to compress JPEG");
        assert_eq!(jpeg_result.width, 100);
        assert_eq!(jpeg_result.height, 100);
        assert_eq!(jpeg_result.original_size, jpeg_data.len() as u32);
    }

    #[test]
    fn test_compress_to_webp_solid_color() {
        // 测试纯色图片压缩（应该有很好的压缩率）
        let solid_data = generate_solid_color_image(200, 200, Rgb([255, 0, 0]))
            .expect("Failed to generate solid color image");
        
        let result = compress_to_webp(solid_data.clone(), None).expect("Failed to compress solid color image");
        
        // 验证结果
        assert_eq!(result.width, 200);
        assert_eq!(result.height, 200);
        assert_eq!(result.original_size, solid_data.len() as u32);
        assert!(result.compressed_size > 0);
        // 纯色图片应该有很好的压缩率
        assert!(result.compression_ratio < 0.5, "Solid color image should compress well");
    }

    #[test]
    fn test_compress_to_webp_edge_dimensions() {
        // 测试边缘尺寸
        let dimensions = vec![(1, 1), (1, 100), (100, 1), (2, 2)];
        
        for (width, height) in dimensions {
            let png_data = generate_test_png(width, height)
                .expect(&format!("Failed to generate {}x{} test PNG", width, height));
            
            let result = compress_to_webp(png_data.clone(), None)
                .expect(&format!("Failed to compress {}x{} image", width, height));
            
            // 验证结果
            assert_eq!(result.width, width);
            assert_eq!(result.height, height);
            assert_eq!(result.original_size, png_data.len() as u32);
            assert!(result.compressed_size > 0);
            assert!(!result.data.is_empty());
        }
    }

    #[test]
    fn test_compress_to_webp_error_handling() {
        // 测试错误处理
        let invalid_data = vec![0u8; 100]; // 无效的图片数据
        let empty_data = vec![];
        
        // 测试无效数据
        let result = compress_to_webp(invalid_data, None);
        assert!(result.is_err(), "Should return error for invalid image data");
        
        // 测试空数据
        let result = compress_to_webp(empty_data, None);
        assert!(result.is_err(), "Should return error for empty data");
    }

    #[test]
    fn test_batch_compress_to_webp_basic() {
        // 测试基本的批量压缩功能
        let mut images = Vec::new();
        for i in 0..3 {
            let png_data = generate_test_png(50 + i * 20, 50 + i * 20)
                .expect(&format!("Failed to generate test PNG {}", i));
            images.push(png_data);
        }
        
        let results = batch_compress_to_webp(images, None).expect("Failed to batch compress");
        
        // 验证结果
        assert_eq!(results.len(), 3);
        
        for (i, result) in results.iter().enumerate() {
            let expected_size = 50 + i * 20;
            assert_eq!(result.width, expected_size as u32);
            assert_eq!(result.height, expected_size as u32);
            assert!(result.compressed_size > 0);
            assert!(!result.data.is_empty());
        }
    }

    #[test]
    fn test_batch_compress_to_webp_with_options() {
        // 测试带选项的批量压缩
        let mut images = Vec::new();
        for i in 0..2 {
            let png_data = generate_test_png(100, 100)
                .expect(&format!("Failed to generate test PNG {}", i));
            images.push(png_data);
        }
        
        let options = WebPCompressOptions {
            quality: Some(70),
            lossless: Some(false),
        };
        
        let results = batch_compress_to_webp(images, Some(options)).expect("Failed to batch compress with options");
        
        // 验证结果
        assert_eq!(results.len(), 2);
        
        for result in &results {
            assert_eq!(result.width, 100);
            assert_eq!(result.height, 100);
            assert!(result.compressed_size > 0);
            assert!(!result.data.is_empty());
        }
    }

    #[test]
    fn test_batch_compress_to_webp_empty_list() {
        // 测试空列表
        let empty_images: Vec<Vec<u8>> = vec![];
        
        let results = batch_compress_to_webp(empty_images, None).expect("Failed to batch compress empty list");
        
        // 应该返回空结果
        assert!(results.is_empty(), "Empty input should return empty result");
    }

    #[test]
    fn test_batch_compress_to_webp_mixed_formats() {
        // 测试混合格式的批量压缩
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        let jpeg_data = generate_test_jpeg(100, 100, 85).expect("Failed to generate test JPEG");
        let solid_data = generate_solid_color_image(100, 100, Rgb([128, 64, 192]))
            .expect("Failed to generate solid color image");
        
        let images = vec![png_data, jpeg_data, solid_data];
        
        let results = batch_compress_to_webp(images, None).expect("Failed to batch compress mixed formats");
        
        // 验证结果
        assert_eq!(results.len(), 3);
        
        for result in &results {
            assert_eq!(result.width, 100);
            assert_eq!(result.height, 100);
            assert!(result.compressed_size > 0);
            assert!(!result.data.is_empty());
        }
    }

    #[test]
    fn test_batch_compress_to_webp_error_handling() {
        // 测试批量压缩的错误处理
        let valid_png = generate_test_png(100, 100).expect("Failed to generate valid PNG");
        let invalid_data = vec![0u8; 100]; // 无效的图片数据
        
        let images = vec![valid_png, invalid_data];
        
        let result = batch_compress_to_webp(images, None);
        
        // 应该返回错误，因为包含无效图片
        assert!(result.is_err(), "Should return error when batch contains invalid image");
    }

    #[test]
    fn test_webp_compress_options_default() {
        // 测试默认选项
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        // 使用默认选项（None）
        let result = compress_to_webp(png_data.clone(), None).expect("Failed to compress with default options");
        
        // 验证结果
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert_eq!(result.original_size, png_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_webp_compress_options_partial() {
        // 测试部分选项
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        // 只设置质量，不设置无损
        let options = WebPCompressOptions {
            quality: Some(90),
            lossless: None,
        };
        
        let result = compress_to_webp(png_data.clone(), Some(options)).expect("Failed to compress with partial options");
        
        // 验证结果
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert_eq!(result.original_size, png_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_webp_compress_result_structure() {
        // 测试WebPCompressResult结构体的完整性
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        let result = compress_to_webp(png_data.clone(), None).expect("Failed to compress PNG");
        
        // 验证所有字段都有合理的值
        assert!(result.data.len() > 0, "Data should not be empty");
        assert!(result.original_size > 0, "Original size should be positive");
        assert!(result.compressed_size > 0, "Compressed size should be positive");
        assert!(result.compression_ratio > 0.0, "Compression ratio should be positive");
        assert!(result.compression_ratio <= 1.0, "Compression ratio should not exceed 1.0");
        assert!(result.width > 0, "Width should be positive");
        assert!(result.height > 0, "Height should be positive");
        
        // 验证压缩率计算是否正确
        let expected_ratio = result.compressed_size as f64 / result.original_size as f64;
        assert!((result.compression_ratio - expected_ratio).abs() < 0.001, "Compression ratio calculation should be accurate");
    }

    #[test]
    fn test_webp_compress_large_image() {
        // 测试大图片压缩
        let large_data = generate_test_png(1000, 1000).expect("Failed to generate large test PNG");
        
        let result = compress_to_webp(large_data.clone(), None).expect("Failed to compress large image");
        
        // 验证结果
        assert_eq!(result.width, 1000);
        assert_eq!(result.height, 1000);
        assert_eq!(result.original_size, large_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_webp_compress_small_image() {
        // 测试小图片压缩
        let small_data = generate_test_png(10, 10).expect("Failed to generate small test PNG");
        
        let result = compress_to_webp(small_data.clone(), None).expect("Failed to compress small image");
        
        // 验证结果
        assert_eq!(result.width, 10);
        assert_eq!(result.height, 10);
        assert_eq!(result.original_size, small_data.len() as u32);
        assert!(result.compressed_size > 0);
        assert!(!result.data.is_empty());
    }

    #[test]
    fn test_webp_compress_quality_range() {
        // 测试不同质量范围的压缩
        let png_data = generate_test_png(100, 100).expect("Failed to generate test PNG");
        
        let qualities = vec![10, 30, 50, 70, 90];
        let mut results = Vec::new();
        
        for quality in qualities {
            let options = WebPCompressOptions {
                quality: Some(quality),
                lossless: Some(false),
            };
            
            let result = compress_to_webp(png_data.clone(), Some(options))
                .expect(&format!("Failed to compress with quality {}", quality));
            
            results.push(result);
        }
        
        // 验证所有结果都是有效的
        for result in &results {
            assert_eq!(result.width, 100);
            assert_eq!(result.height, 100);
            assert!(result.compressed_size > 0);
            assert!(result.compression_ratio > 0.0);
        }
    }
}
