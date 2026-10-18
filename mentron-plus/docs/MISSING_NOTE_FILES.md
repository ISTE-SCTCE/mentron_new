# Missing note files

Checked on 18 October 2026 against the original R2 file store and the shared iste-admin note catalog.

247 note entries reference 178 distinct files. **176 files are present; 2 files are missing.** The missing files affect 2 note entries. The other 245 note entries point to files present in storage. Existence checks do not establish the visual/content quality of every PDF.

| Missing file | Note title | Library location |
| --- | --- | --- |
| `1776747307342-FOC_-_PYQ.pdf` | FOUNDATION OF COMPUTING | 1st year → S2 → Group B → Web Design → PYQs |
| `1776747496808-FOC_-_PREDICTED.pdf` | FOUNDATION OF COMPUTING | 1st year → S2 → Group B → Web Design → PYQs |

Both missing object keys are under `notes_bucket/` in the existing `mentron-files` R2 bucket. Storage returned Not Found for both. No storage requests failed with another error. The original local project did not contain replacement PDFs.

The catalog records and folder locations were preserved. On 18 October, the user confirmed they have no replacement links and requested this report. These two entries will show a document-unavailable message when opened until the original files are restored to those keys or the links are corrected through the existing administration workflow.

Notes and folder metadata currently match the original backend exactly: 247 note entries and 255 folders. No record was deleted, reassigned, or replaced to conceal a missing file.

The complete file-by-file existence audit is retained locally in the ignored `.tools/note-file-audit.json`; it contains file paths and status, with no credentials or signed links.
