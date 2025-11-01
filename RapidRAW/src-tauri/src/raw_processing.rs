use crate::image_processing::apply_orientation;
use anyhow::Result;
use image::{DynamicImage, ImageBuffer, Rgba};
use rawler::{
    decoders::{Orientation, RawDecodeParams},
    imgop::develop::{DemosaicAlgorithm, Intermediate, ProcessingStep, RawDevelop},
    rawimage::RawImage,
    rawsource::RawSource,
};

pub fn develop_raw_image(
    file_bytes: &[u8],
    fast_demosaic: bool,
    highlight_compression: f32,
) -> Result<DynamicImage> {
    let (developed_image, orientation) =
        develop_internal(file_bytes, fast_demosaic, highlight_compression)?;
    Ok(apply_orientation(developed_image, orientation))
}

fn develop_internal(
    file_bytes: &[u8],
    fast_demosaic: bool,
    highlight_compression: f32,
) -> Result<(DynamicImage, Orientation)> {
    let source = RawSource::new_from_slice(file_bytes);
    let decoder = rawler::get_decoder(&source)?;
    let mut raw_image: RawImage = decoder.raw_image(&source, &RawDecodeParams::default(), false)?;

    let metadata = decoder.raw_metadata(&source, &RawDecodeParams::default())?;
    let orientation = metadata
        .exif
        .orientation
        .map(Orientation::from_u16)
        .unwrap_or(Orientation::Normal);

    let original_white_level = raw_image
        .whitelevel
        .0
        .get(0)
        .cloned()
        .unwrap_or(u16::MAX as u32) as f32;
    let original_black_level = raw_image
        .blacklevel
        .levels
        .get(0)
        .map(|r| r.as_f32())
        .unwrap_or(0.0);

    let headroom_white_level = u32::MAX as f32;
    for level in raw_image.whitelevel.0.iter_mut() {
        *level = u32::MAX;
    }

    let mut developer = RawDevelop::default();
    if fast_demosaic {
        developer.demosaic_algorithm = DemosaicAlgorithm::Speed;
    }
    developer.steps.retain(|&step| step != ProcessingStep::SRgb);

    let mut developed_intermediate = developer.develop_intermediate(&raw_image)?;

    let denominator = (original_white_level - original_black_level).max(1.0);
    let rescale_factor = (headroom_white_level - original_black_level) / denominator;

    let safe_highlight_compression = highlight_compression.max(1.01);

    match &mut developed_intermediate {
        Intermediate::Monochrome(pixels) => {
            pixels.data.iter_mut().for_each(|p| {
                let linear_val = *p * rescale_factor;
                *p = linear_val;
            });
        }
        Intermediate::ThreeColor(pixels) => {
            pixels.data.iter_mut().for_each(|p| {
                let r = (p[0] * rescale_factor).max(0.0);
                let g = (p[1] * rescale_factor).max(0.0);
                let b = (p[2] * rescale_factor).max(0.0);

                let max_c = r.max(g).max(b);

                let (final_r, final_g, final_b) = if max_c > 1.0 {
                    let min_c = r.min(g).min(b);
                    let compression_factor = (1.0
                        - (max_c - 1.0) / (safe_highlight_compression - 1.0))
                        .max(0.0)
                        .min(1.0);
                    let compressed_r = min_c + (r - min_c) * compression_factor;
                    let compressed_g = min_c + (g - min_c) * compression_factor;
                    let compressed_b = min_c + (b - min_c) * compression_factor;
                    let compressed_max = compressed_r.max(compressed_g).max(compressed_b);

                    if compressed_max > 1e-6 {
                        let rescale = max_c / compressed_max;
                        (
                            compressed_r * rescale,
                            compressed_g * rescale,
                            compressed_b * rescale,
                        )
                    } else {
                        (max_c, max_c, max_c)
                    }
                } else {
                    (r, g, b)
                };

                p[0] = final_r;
                p[1] = final_g;
                p[2] = final_b;
            });
        }
        Intermediate::FourColor(pixels) => {
            pixels.data.iter_mut().for_each(|p| {
                p.iter_mut().for_each(|c| {
                    let linear_val = *c * rescale_factor;
                    *c = linear_val;
                });
            });
        }
    }

    let (width, height) = {
        let dim = developed_intermediate.dim();
        (dim.w as u32, dim.h as u32)
    };
    let dynamic_image = match developed_intermediate {
        Intermediate::ThreeColor(pixels) => {
            let buffer = ImageBuffer::<Rgba<f32>, _>::from_fn(width, height, |x, y| {
                let p = pixels.data[(y * width + x) as usize];
                Rgba([p[0], p[1], p[2], 1.0])
            });
            DynamicImage::ImageRgba32F(buffer)
        }
        Intermediate::Monochrome(pixels) => {
            let buffer = ImageBuffer::<Rgba<f32>, _>::from_fn(width, height, |x, y| {
                let p = pixels.data[(y * width + x) as usize];
                Rgba([p, p, p, 1.0])
            });
            DynamicImage::ImageRgba32F(buffer)
        }
        _ => {
            return Err(anyhow::anyhow!(
                "Unsupported intermediate format for f32 conversion"
            ));
        }
    };

    Ok((dynamic_image, orientation))
}