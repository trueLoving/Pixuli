//! 图片尺寸调整功能模块
//! 
//! 提供图片尺寸调整和宽高比计算功能

use crate::format_conversion::types::ResizeOptions;

/// 计算调整后的尺寸
pub fn calculate_resize_dimensions(
    original_width: u32,
    original_height: u32,
    resize: &ResizeOptions,
) -> (u32, u32) {
    let maintain_aspect_ratio = resize.maintain_aspect_ratio.unwrap_or(true);
    
    match (resize.width, resize.height) {
        (Some(target_width), Some(target_height)) => {
            if !maintain_aspect_ratio {
                return (target_width, target_height);
            }
            
            // 保持宽高比
            calculate_aspect_ratio_resize(
                original_width,
                original_height,
                target_width,
                target_height,
            )
        }
        (Some(target_width), None) => {
            // 只指定宽度
            let new_height = if maintain_aspect_ratio {
                calculate_height_from_width(original_width, original_height, target_width)
            } else {
                original_height
            };
            (target_width, new_height)
        }
        (None, Some(target_height)) => {
            // 只指定高度
            let new_width = if maintain_aspect_ratio {
                calculate_width_from_height(original_width, original_height, target_height)
            } else {
                original_width
            };
            (new_width, target_height)
        }
        (None, None) => {
            // 没有指定尺寸调整
            (original_width, original_height)
        }
    }
}

/// 计算保持宽高比的尺寸调整
fn calculate_aspect_ratio_resize(
    original_width: u32,
    original_height: u32,
    target_width: u32,
    target_height: u32,
) -> (u32, u32) {
    let aspect_ratio = original_width as f64 / original_height as f64;
    let target_aspect_ratio = target_width as f64 / target_height as f64;
    
    if aspect_ratio > target_aspect_ratio {
        // 原图更宽，以宽度为准
        let new_height = (target_width as f64 / aspect_ratio) as u32;
        (target_width, new_height)
    } else {
        // 原图更高，以高度为准
        let new_width = (target_height as f64 * aspect_ratio) as u32;
        (new_width, target_height)
    }
}

/// 根据宽度计算高度
fn calculate_height_from_width(original_width: u32, original_height: u32, target_width: u32) -> u32 {
    (original_height as f64 * target_width as f64 / original_width as f64) as u32
}

/// 根据高度计算宽度
fn calculate_width_from_height(original_width: u32, original_height: u32, target_height: u32) -> u32 {
    (original_width as f64 * target_height as f64 / original_height as f64) as u32
}

/// 验证尺寸参数的有效性
pub fn validate_resize_options(resize: &ResizeOptions) -> Result<(), String> {
    if let (Some(width), Some(height)) = (resize.width, resize.height) {
        if width == 0 || height == 0 {
            return Err("Width and height must be greater than 0".to_string());
        }
        
        if width > 10000 || height > 10000 {
            return Err("Width and height must be less than 10000".to_string());
        }
    } else if let Some(width) = resize.width {
        if width == 0 {
            return Err("Width must be greater than 0".to_string());
        }
        if width > 10000 {
            return Err("Width must be less than 10000".to_string());
        }
    } else if let Some(height) = resize.height {
        if height == 0 {
            return Err("Height must be greater than 0".to_string());
        }
        if height > 10000 {
            return Err("Height must be less than 10000".to_string());
        }
    }
    
    Ok(())
}

/// 获取推荐的尺寸调整选项
pub fn get_recommended_resize_options(
    original_width: u32,
    original_height: u32,
    max_dimension: u32,
) -> ResizeOptions {
    let _aspect_ratio = original_width as f64 / original_height as f64;
    
    let (target_width, target_height) = if original_width > original_height {
        // 横向图片
        if original_width > max_dimension {
            (max_dimension, calculate_height_from_width(original_width, original_height, max_dimension))
        } else {
            (original_width, original_height)
        }
    } else {
        // 纵向图片
        if original_height > max_dimension {
            (calculate_width_from_height(original_width, original_height, max_dimension), max_dimension)
        } else {
            (original_width, original_height)
        }
    };
    
    ResizeOptions {
        width: Some(target_width),
        height: Some(target_height),
        maintain_aspect_ratio: Some(true),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_resize_dimensions_both_specified() {
        let resize = ResizeOptions {
            width: Some(200),
            height: Some(150),
            maintain_aspect_ratio: Some(true),
        };
        
        let (width, height) = calculate_resize_dimensions(400, 300, &resize);
        assert_eq!(width, 200);
        assert_eq!(height, 150);
    }

    #[test]
    fn test_calculate_resize_dimensions_width_only() {
        let resize = ResizeOptions {
            width: Some(200),
            height: None,
            maintain_aspect_ratio: Some(true),
        };
        
        let (width, height) = calculate_resize_dimensions(400, 300, &resize);
        assert_eq!(width, 200);
        assert_eq!(height, 150);
    }

    #[test]
    fn test_calculate_resize_dimensions_height_only() {
        let resize = ResizeOptions {
            width: None,
            height: Some(150),
            maintain_aspect_ratio: Some(true),
        };
        
        let (width, height) = calculate_resize_dimensions(400, 300, &resize);
        assert_eq!(width, 200);
        assert_eq!(height, 150);
    }

    #[test]
    fn test_calculate_resize_dimensions_no_aspect_ratio() {
        let resize = ResizeOptions {
            width: Some(200),
            height: Some(100),
            maintain_aspect_ratio: Some(false),
        };
        
        let (width, height) = calculate_resize_dimensions(400, 300, &resize);
        assert_eq!(width, 200);
        assert_eq!(height, 100);
    }

    #[test]
    fn test_validate_resize_options_valid() {
        let resize = ResizeOptions {
            width: Some(200),
            height: Some(150),
            maintain_aspect_ratio: Some(true),
        };
        
        assert!(validate_resize_options(&resize).is_ok());
    }

    #[test]
    fn test_validate_resize_options_invalid_zero() {
        let resize = ResizeOptions {
            width: Some(0),
            height: Some(150),
            maintain_aspect_ratio: Some(true),
        };
        
        assert!(validate_resize_options(&resize).is_err());
    }

    #[test]
    fn test_get_recommended_resize_options() {
        let options = get_recommended_resize_options(800, 600, 500);
        assert!(options.width.is_some());
        assert!(options.height.is_some());
        assert_eq!(options.maintain_aspect_ratio, Some(true));
    }
}
