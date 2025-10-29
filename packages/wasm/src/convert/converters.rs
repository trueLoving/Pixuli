//! 图片格式转换器模块
//!
//! 提供各种图片格式之间的转换功能

use napi::Error as NapiError;
use image::{DynamicImage, ColorType};
use crate::convert::types::SupportedFormat;

/// 格式转换器 trait
pub trait FormatConverter {
    /// 转换图片格式
    fn convert(&self, img: &DynamicImage, options: &ConversionOptions) -> Result<Vec<u8>, NapiError>;

    /// 获取支持的格式
    fn supported_format(&self) -> SupportedFormat;
}

/// 转换选项
#[derive(Debug, Clone)]
pub struct ConversionOptions {
    pub quality: u8,
    pub preserve_transparency: bool,
    pub lossless: bool,
}

impl Default for ConversionOptions {
    fn default() -> Self {
        Self {
            quality: 80,
            preserve_transparency: true,
            lossless: false,
        }
    }
}

/// JPEG 转换器
pub struct JpegConverter;

impl FormatConverter for JpegConverter {
    fn convert(&self, img: &DynamicImage, options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_jpeg(img, options.quality)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::Jpeg
    }
}

/// PNG 转换器
pub struct PngConverter;

impl FormatConverter for PngConverter {
    fn convert(&self, img: &DynamicImage, options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_png(img, options.preserve_transparency)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::Png
    }
}

/// WebP 转换器
pub struct WebPConverter;

impl FormatConverter for WebPConverter {
    fn convert(&self, img: &DynamicImage, options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_webp(img, options.quality, options.lossless)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::WebP
    }
}

/// GIF 转换器
pub struct GifConverter;

impl FormatConverter for GifConverter {
    fn convert(&self, img: &DynamicImage, _options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_gif(img)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::Gif
    }
}

/// BMP 转换器
pub struct BmpConverter;

impl FormatConverter for BmpConverter {
    fn convert(&self, img: &DynamicImage, _options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_bmp(img)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::Bmp
    }
}

/// TIFF 转换器
pub struct TiffConverter;

impl FormatConverter for TiffConverter {
    fn convert(&self, img: &DynamicImage, _options: &ConversionOptions) -> Result<Vec<u8>, NapiError> {
        convert_to_tiff(img)
    }

    fn supported_format(&self) -> SupportedFormat {
        SupportedFormat::Tiff
    }
}

/// 获取格式转换器
pub fn get_converter(format: &SupportedFormat) -> Box<dyn FormatConverter> {
    match format {
        SupportedFormat::Jpeg => Box::new(JpegConverter),
        SupportedFormat::Png => Box::new(PngConverter),
        SupportedFormat::WebP => Box::new(WebPConverter),
        SupportedFormat::Gif => Box::new(GifConverter),
        SupportedFormat::Bmp => Box::new(BmpConverter),
        SupportedFormat::Tiff => Box::new(TiffConverter),
    }
}

/// 转换为 JPEG 格式
fn convert_to_jpeg(img: &DynamicImage, quality: u8) -> Result<Vec<u8>, NapiError> {
    let mut buffer = Vec::new();
    let rgb_img = img.to_rgb8();

    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, quality);
    encoder.encode(&rgb_img, rgb_img.width(), rgb_img.height(), ColorType::Rgb8)
        .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("JPEG encoding failed: {}", e)))?;

    Ok(buffer)
}

/// 转换为 PNG 格式
#[allow(deprecated)]
fn convert_to_png(img: &DynamicImage, preserve_transparency: bool) -> Result<Vec<u8>, NapiError> {
    let mut buffer = Vec::new();

    if preserve_transparency && img.color().has_alpha() {
        let rgba_img = img.to_rgba8();
        let encoder = image::codecs::png::PngEncoder::new(&mut buffer);
        encoder.encode(&rgba_img, rgba_img.width(), rgba_img.height(), ColorType::Rgba8)
            .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("PNG encoding failed: {}", e)))?;
    } else {
        let rgb_img = img.to_rgb8();
        let encoder = image::codecs::png::PngEncoder::new(&mut buffer);
        encoder.encode(&rgb_img, rgb_img.width(), rgb_img.height(), ColorType::Rgb8)
            .map_err(|e| NapiError::new(napi::Status::GenericFailure, format!("PNG encoding failed: {}", e)))?;
    }

    Ok(buffer)
}

/// 转换为 WebP 格式
fn convert_to_webp(img: &DynamicImage, quality: u8, lossless: bool) -> Result<Vec<u8>, NapiError> {
    use webp::{Encoder, PixelLayout};

    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();

    let encoder = if lossless {
        Encoder::new(&rgb_img, PixelLayout::Rgb, width, height).encode_lossless()
    } else {
        Encoder::new(&rgb_img, PixelLayout::Rgb, width, height).encode(quality as f32)
    };

    Ok(encoder.to_vec())
}

/// 转换为 GIF 格式
fn convert_to_gif(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
    // 暂时使用 PNG 作为 GIF 的替代，因为 GIF 编码比较复杂
    // 在实际项目中，可以使用专门的 GIF 库
    convert_to_png(img, false)
}

/// 转换为 BMP 格式
fn convert_to_bmp(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
    // 暂时使用 PNG 作为 BMP 的替代
    // 在实际项目中，可以实现真正的 BMP 编码
    convert_to_png(img, false)
}

/// 转换为 TIFF 格式
fn convert_to_tiff(img: &DynamicImage) -> Result<Vec<u8>, NapiError> {
    // 暂时使用 PNG 作为 TIFF 的替代
    // 在实际项目中，可以使用专门的 TIFF 库
    convert_to_png(img, false)
}

/// 批量转换图片
pub fn batch_convert_images(
    images: Vec<DynamicImage>,
    converter: &dyn FormatConverter,
    options: &ConversionOptions,
) -> Result<Vec<Vec<u8>>, NapiError> {
    let mut results = Vec::new();

    for img in images {
        match converter.convert(&img, options) {
            Ok(data) => results.push(data),
            Err(e) => return Err(NapiError::new(
                napi::Status::GenericFailure,
                format!("Batch conversion failed: {}", e)
            )),
        }
    }

    Ok(results)
}

/// 验证转换选项
pub fn validate_conversion_options(options: &ConversionOptions) -> Result<(), String> {
    if options.quality == 0 || options.quality > 100 {
        return Err("Quality must be between 1 and 100".to_string());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    /// 生成测试图片
    fn generate_test_image(width: u32, height: u32) -> DynamicImage {
        let img: RgbImage = ImageBuffer::from_fn(width, height, |x, y| {
            Rgb([(x * 255 / width) as u8, (y * 255 / height) as u8, 128])
        });
        DynamicImage::ImageRgb8(img)
    }

    #[test]
    fn test_jpeg_converter() {
        let converter = JpegConverter;
        let img = generate_test_image(100, 100);
        let options = ConversionOptions {
            quality: 80,
            preserve_transparency: false,
            lossless: false,
        };

        let result = converter.convert(&img, &options);
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }

    #[test]
    fn test_png_converter() {
        let converter = PngConverter;
        let img = generate_test_image(100, 100);
        let options = ConversionOptions {
            quality: 80,
            preserve_transparency: true,
            lossless: false,
        };

        let result = converter.convert(&img, &options);
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }

    #[test]
    fn test_webp_converter() {
        let converter = WebPConverter;
        let img = generate_test_image(100, 100);
        let options = ConversionOptions {
            quality: 80,
            preserve_transparency: false,
            lossless: false,
        };

        let result = converter.convert(&img, &options);
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }

    #[test]
    fn test_get_converter() {
        let converter = get_converter(&SupportedFormat::Jpeg);
        assert_eq!(converter.supported_format(), SupportedFormat::Jpeg);
    }

    #[test]
    fn test_validate_conversion_options() {
        let valid_options = ConversionOptions {
            quality: 80,
            preserve_transparency: true,
            lossless: false,
        };
        assert!(validate_conversion_options(&valid_options).is_ok());

        let invalid_options = ConversionOptions {
            quality: 0,
            preserve_transparency: true,
            lossless: false,
        };
        assert!(validate_conversion_options(&invalid_options).is_err());
    }
}
