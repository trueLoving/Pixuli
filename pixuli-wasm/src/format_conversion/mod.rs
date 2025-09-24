//! 图片格式转换功能模块
//! 
//! 提供各种图片格式之间的转换功能，包括：
//! - 支持多种图片格式转换 (JPEG, PNG, WebP, GIF, BMP, TIFF)
//! - 图片尺寸调整和宽高比保持
//! - 批量转换功能
//! - 转换统计和质量控制

pub mod types;
pub mod resize;
pub mod converters;

// 重新导出主要类型和函数
pub use types::{
    FormatConversionOptions,
    FormatConversionResult,
    ResizeOptions,
    SupportedFormat,
    ConversionStats,
};

pub use resize::{
    calculate_resize_dimensions,
    validate_resize_options,
    get_recommended_resize_options,
};

pub use converters::{
    FormatConverter,
    ConversionOptions,
    get_converter,
    batch_convert_images,
    validate_conversion_options,
};

use napi_derive::napi;
use napi::Error as NapiError;
use image::GenericImageView;

/// 转换图片格式
#[napi]
pub fn convert_image_format(
    image_data: Vec<u8>,
    options: FormatConversionOptions,
) -> Result<FormatConversionResult, NapiError> {
    let start_time = std::time::Instant::now();
    
    // 解析图片
    let img = image::load_from_memory(&image_data)
        .map_err(|e| NapiError::new(napi::Status::InvalidArg, format!("Failed to load image: {}", e)))?;

    let (original_width, original_height) = img.dimensions();
    let original_size = image_data.len() as u32;

    // 验证尺寸调整选项
    if let Some(ref resize) = options.resize {
        validate_resize_options(resize)
            .map_err(|e| NapiError::new(napi::Status::InvalidArg, e))?;
    }

    // 处理尺寸调整
    let (final_width, final_height) = if let Some(resize) = &options.resize {
        calculate_resize_dimensions(original_width, original_height, resize)
    } else {
        (original_width, original_height)
    };

    // 调整图片尺寸
    let resized_img = if final_width != original_width || final_height != original_height {
        img.resize(final_width, final_height, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };

    // 解析目标格式
    let target_format = SupportedFormat::from_string(&options.target_format)
        .ok_or_else(|| NapiError::new(napi::Status::InvalidArg, format!("Unsupported target format: {}", options.target_format)))?;

    // 创建转换选项
    let conversion_options = converters::ConversionOptions {
        quality: options.quality.unwrap_or(80),
        preserve_transparency: options.preserve_transparency.unwrap_or(true),
        lossless: options.lossless.unwrap_or(false),
    };

    // 验证转换选项
    validate_conversion_options(&conversion_options)
        .map_err(|e| NapiError::new(napi::Status::InvalidArg, e))?;

    // 获取转换器并执行转换
    let converter = get_converter(&target_format);
    let converted_data = converter.convert(&resized_img, &conversion_options)?;

    let converted_size = converted_data.len() as u32;
    let conversion_time = start_time.elapsed().as_millis() as f64;

    Ok(FormatConversionResult {
        data: converted_data,
        original_size,
        converted_size,
        width: final_width,
        height: final_height,
        original_width,
        original_height,
        conversion_time,
    })
}

/// 批量转换图片格式
#[napi]
pub fn batch_convert_image_format(
    images_data: Vec<Vec<u8>>,
    options: FormatConversionOptions,
) -> Result<Vec<FormatConversionResult>, NapiError> {
    let mut results = Vec::new();
    
    for image_data in images_data {
        match convert_image_format(image_data, options.clone()) {
            Ok(result) => results.push(result),
            Err(e) => return Err(NapiError::new(napi::Status::GenericFailure, format!("Batch conversion failed: {}", e))),
        }
    }
    
    Ok(results)
}

/// 获取支持的图片格式列表
#[napi]
pub fn get_supported_formats() -> Vec<String> {
    vec![
        "jpeg".to_string(),
        "jpg".to_string(),
        "png".to_string(),
        "webp".to_string(),
        "gif".to_string(),
        "bmp".to_string(),
        "tiff".to_string(),
        "tif".to_string(),
    ]
}

/// 获取格式的详细信息
#[napi]
pub fn get_format_info(format_str: String) -> Result<String, NapiError> {
    let format = SupportedFormat::from_string(&format_str)
        .ok_or_else(|| NapiError::new(napi::Status::InvalidArg, format!("Unsupported format: {}", format_str)))?;

    let info = serde_json::json!({
        "format": format_str,
        "extension": format.extension(),
        "mime_type": format.mime_type(),
        "supports_quality": matches!(format, SupportedFormat::Jpeg | SupportedFormat::WebP),
        "supports_transparency": matches!(format, SupportedFormat::Png | SupportedFormat::WebP | SupportedFormat::Gif),
        "supports_lossless": matches!(format, SupportedFormat::Png | SupportedFormat::WebP),
    });

    Ok(info.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    /// 生成测试图片
    #[allow(deprecated)]
    fn generate_test_image(width: u32, height: u32) -> Vec<u8> {
        let img: RgbImage = ImageBuffer::from_fn(width, height, |x, y| {
            Rgb([(x * 255 / width) as u8, (y * 255 / height) as u8, 128])
        });
        
        let mut buffer = Vec::new();
        let encoder = image::codecs::png::PngEncoder::new(&mut buffer);
        encoder.encode(&img, width, height, image::ColorType::Rgb8).unwrap();
        buffer
    }

    #[test]
    fn test_convert_image_format_basic() {
        let image_data = generate_test_image(100, 100);
        let options = FormatConversionOptions {
            target_format: "jpeg".to_string(),
            quality: Some(80),
            preserve_transparency: Some(false),
            lossless: Some(false),
            color_space: None,
            resize: None,
        };

        let result = convert_image_format(image_data, options);
        assert!(result.is_ok());
        
        let result = result.unwrap();
        assert!(!result.data.is_empty());
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert!(result.conversion_time > 0.0);
    }

    #[test]
    fn test_convert_image_format_with_resize() {
        let image_data = generate_test_image(200, 200);
        let options = FormatConversionOptions {
            target_format: "png".to_string(),
            quality: Some(80),
            preserve_transparency: Some(true),
            lossless: Some(false),
            color_space: None,
            resize: Some(ResizeOptions {
                width: Some(100),
                height: Some(100),
                maintain_aspect_ratio: Some(true),
            }),
        };

        let result = convert_image_format(image_data, options);
        assert!(result.is_ok());
        
        let result = result.unwrap();
        assert_eq!(result.width, 100);
        assert_eq!(result.height, 100);
        assert_eq!(result.original_width, 200);
        assert_eq!(result.original_height, 200);
    }

    #[test]
    fn test_batch_convert_image_format() {
        let images_data = vec![
            generate_test_image(100, 100),
            generate_test_image(150, 150),
        ];
        
        let options = FormatConversionOptions {
            target_format: "webp".to_string(),
            quality: Some(80),
            preserve_transparency: Some(false),
            lossless: Some(false),
            color_space: None,
            resize: None,
        };

        let result = batch_convert_image_format(images_data, options);
        assert!(result.is_ok());
        
        let results = result.unwrap();
        assert_eq!(results.len(), 2);
        assert!(!results[0].data.is_empty());
        assert!(!results[1].data.is_empty());
    }

    #[test]
    fn test_get_supported_formats() {
        let formats = get_supported_formats();
        assert!(formats.contains(&"jpeg".to_string()));
        assert!(formats.contains(&"png".to_string()));
        assert!(formats.contains(&"webp".to_string()));
    }

    #[test]
    fn test_get_format_info() {
        let info = get_format_info("png".to_string());
        assert!(info.is_ok());
        
        let info_str = info.unwrap();
        assert!(info_str.contains("png"));
        assert!(info_str.contains("image/png"));
    }

    #[test]
    fn test_convert_image_format_unsupported_format() {
        let image_data = generate_test_image(100, 100);
        let options = FormatConversionOptions {
            target_format: "unsupported".to_string(),
            quality: Some(80),
            preserve_transparency: Some(false),
            lossless: Some(false),
            color_space: None,
            resize: None,
        };

        let result = convert_image_format(image_data, options);
        assert!(result.is_err());
    }
}
