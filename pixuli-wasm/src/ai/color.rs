//! 颜色分析相关功能

/// 增强的颜色名称识别
pub fn get_enhanced_color_name(rgb: (u8, u8, u8)) -> String {
  let (r, g, b) = rgb;
  
  // 计算颜色的HSV值来更准确地识别颜色
  let r_f = r as f64 / 255.0;
  let g_f = g as f64 / 255.0;
  let b_f = b as f64 / 255.0;
  
  let max = r_f.max(g_f).max(b_f);
  let min = r_f.min(g_f).min(b_f);
  let delta = max - min;
  
  // 计算饱和度
  let saturation = if max > 0.0 { delta / max } else { 0.0 };
  
  // 计算明度
  let value = max;
  
  // 低饱和度的情况（灰度色）
  if saturation < 0.2 {
    if value > 0.9 {
      return "纯白".to_string();
    } else if value > 0.7 {
      return "浅灰".to_string();
    } else if value > 0.3 {
      return "中灰".to_string();
    } else if value > 0.1 {
      return "深灰".to_string();
    } else {
      return "纯黑".to_string();
    }
  }
  
  // 高饱和度的情况（彩色）
  match (r, g, b) {
    // 红色系
    (r, g, b) if r > g + 30 && r > b + 30 => {
      if r > 200 && g < 100 && b < 100 {
        "鲜红色".to_string()
      } else if r > 150 && g > 50 && g < 120 && b < 80 {
        "橙红色".to_string()
      } else if r > 120 && g < 80 && b < 80 {
        "深红色".to_string()
      } else {
        "红色系".to_string()
      }
    },
    // 绿色系
    (r, g, b) if g > r + 30 && g > b + 30 => {
      if g > 200 && r < 100 && b < 100 {
        "鲜绿色".to_string()
      } else if r > 100 && g > 150 && b < 80 {
        "黄绿色".to_string()
      } else if r < 80 && g > 120 && b < 80 {
        "深绿色".to_string()
      } else if r < 100 && g > 150 && b > 100 {
        "青绿色".to_string()
      } else {
        "绿色系".to_string()
      }
    },
    // 蓝色系
    (r, g, b) if b > r + 30 && b > g + 30 => {
      if b > 200 && r < 100 && g < 100 {
        "鲜蓝色".to_string()
      } else if r < 80 && g > 100 && b > 150 {
        "青蓝色".to_string()
      } else if r > 100 && g < 80 && b > 150 {
        "紫蓝色".to_string()
      } else if r < 80 && g < 80 && b > 120 {
        "深蓝色".to_string()
      } else {
        "蓝色系".to_string()
      }
    },
    // 黄色系
    (r, g, b) if r > 150 && g > 150 && b < 100 => {
      if r > 200 && g > 200 && b < 50 {
        "鲜黄色".to_string()
      } else if r > 180 && g > 140 && b < 80 {
        "金黄色".to_string()
      } else {
        "黄色系".to_string()
      }
    },
    // 紫色系
    (r, g, b) if r > 100 && g < 100 && b > 100 => {
      if r > 150 && g < 80 && b > 150 {
        "紫色".to_string()
      } else if r > 120 && g < 60 && b > 100 {
        "深紫色".to_string()
      } else {
        "紫色系".to_string()
      }
    },
    // 青色系
    (r, g, b) if r < 100 && g > 120 && b > 120 => {
      if r < 50 && g > 180 && b > 180 {
        "青色".to_string()
      } else {
        "青色系".to_string()
      }
    },
    // 橙色系
    (r, g, b) if r > 150 && g > 80 && g < 150 && b < 100 => {
      "橙色系".to_string()
    },
    // 棕色系
    (r, g, b) if r > 80 && r < 160 && g > 50 && g < 120 && b > 20 && b < 80 => {
      "棕色系".to_string()
    },
    // 粉色系
    (r, g, b) if r > 180 && g > 120 && g < 180 && b > 120 && b < 180 => {
      "粉色系".to_string()
    },
    _ => "混合色".to_string()
  }
}
