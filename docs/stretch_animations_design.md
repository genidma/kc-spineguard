# Stretch Animation & Clinical Illustration Architecture

**Feature Issue:** [#8](https://github.com/genidma/kc-spineguard/issues/8)  
**Author:** Antigravity (AGY)  
**Status:** Architecture Draft  

---

## 🎯 1. Design Philosophy
Providing patients and individuals managing sciatica with clear visual reassurance on proper biomechanical alignment during stretching without heavy raster video files or intrusive external players.

## 📐 2. Technical Stack & Implementation Strategy

### A. Pure SVG Biomechanical Line Art
- Built with crisp vector paths representing skeletal/muscle alignment.
- Zero network bloat: embedded directly in React components.
- Responsive scaling from compact thumbnails (Library cards) to full-width modal views (Active Hold Timer).

### B. Subtle CSS / Motion Keyframes
- Smooth, gentle pulsing animations demonstrating:
  - **Spinal Decompression:** Subtly elongating the lumbar spine.
  - **Nerve Glides:** Rhythmic knee flexion and cervical extension.
  - **Squatting Mechanics:** Hips gently settling downward while maintaining flat-foot contact.

### C. Contrast & Theme Safety
- High-contrast lines supporting both dark mode (`#ffffff` / `#38bdf8`) and light mode (`#171c22` / `#0051ae`).
- Calm, accessible color palette without sensory overwhelm.

---

## 📋 3. Stretch Coverage Roadmap
1. `deep-squat`: Malasana / flat-foot resting squat
2. `knee-to-chest`: Single knee lumbar flexion
3. `piriformis`: Supine figure-4 glute stretch
4. `nerve-glide`: Seated sciatic nerve flossing
5. `cat-cow`: Quadruped spinal articulation
6. `childs-pose`: Resting lumbar extension/decompression
7. `hamstring`: Supine towel leg extension
8. `pelvic-tilt`: Core activation and posterior tilt
9. `prone-press-up`: McKenzie lumbar extension
