# Metadata Wiper

A minimal, browser-local PNG and JPEG metadata cleaner. No accounts, tracking, uploads, or runtime dependencies.

- Removes embedded C2PA/Content Credentials, EXIF, XMP, IPTC, and text metadata.
- Preserves encoded image data without recompression, resizing, or format conversion.
- Preserves PNG color information and JPEG ICC profiles and Adobe rendering information.
- Batch processing with individual and uncompressed ZIP downloads and removal summaries.
- Does not fabricate camera information or guarantee social-platform labeling outcomes.

## Development

Run `npm run dev` and open http://localhost:4173. Run `npm test` for parser and data-preservation tests. GitHub Pages serves `docs/` from `main`.

## Limitations

PNG and JPEG only, up to 100 MB per file. Embedded provenance is removed; pixel watermarks are unchanged. A minimal EXIF orientation field is retained when required to keep a camera JPEG upright. PNG physical-resolution information and image color profiles are retained to preserve rendering. Files with malformed structures may be rejected. Browser-local processing uses memory proportional to file size.

Personal sample images and test outputs are ignored and never included in the repository.
