# Selection Candidate PDF Page Map

First-pass page map for the six include-candidate PDFs in `data/records.json`.

This is a triage aid, not a final FRUS source note. Page roles are inferred from OCR/text-layer signals and must be verified against the PDF before final selection, citation, or declassification accounting.

Generated from 6 candidate PDFs and 395 PDF pages.

Machine-readable page map: [`data/pdf-page-map.csv`](../data/pdf-page-map.csv).

Companion work surfaces: [`pdfs/`](../pdfs/) and [`reports/extraction-worksheet.md`](extraction-worksheet.md).

## Summary

| Record | Pages | Administrative markers | Withdrawal sheets | Withdrawal markers | Released/context pages | First action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| clinton-v27-005 | 3 | 1 | 1 | 1 | 0 | Confirm whether the notes themselves are withheld or available only through markers. |
| clinton-v27-022 | 6 | 0 | 2 | 0 | 4 | Map released pages, withdrawal sheets, and candidate document boundaries. |
| clinton-v27-023 | 157 | 0 | 14 | 0 | 142 | Use the CSV to separate released briefing pages from withdrawal sheets. |
| clinton-v27-030 | 61 | 1 | 2 | 14 | 39 | Map released pages, withdrawal sheets, and candidate document boundaries. |
| clinton-v27-029 | 70 | 1 | 2 | 13 | 54 | Map released pages, withdrawal sheets, and candidate document boundaries. |
| clinton-v27-038 | 98 | 0 | 0 | 0 | 98 | Start with released-document pages and flag Angola/UNITA/South Africa enforcement spans. |

## Page-Role Legend

- `administrative_marker`: Clinton Library or FOIA administrative cover/marker page.
- `withdrawal_sheet`: withdrawal/redaction sheet listing withheld or partially withheld documents.
- `withdrawal_marker`: marker page standing in for a restricted or withdrawn document.
- `released_document_text`: page with strong document-text signals such as classification, memorandum, sender/recipient, or declassification marks.
- `released_or_context_text`: OCR/text present, but the page needs human review to determine whether it is a released document, context page, duplicate, or attachment.
- `blank_or_image_only`: no useful text layer detected by `pdftotext`.

## Record Page Ranges

### clinton-v27-005 - Soderberg notes from Bosnia and Angola PC meeting

- Date: 1994-11-07
- Topic: Angola, Mozambique, and Southern African Security
- Catalog item: https://clinton.presidentiallibraries.us/items/show/72408
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/d99d763c5a60d17afe606193e3fb0a86.pdf
- PDF pages: 3

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1 | [Open](https://clinton.presidentiallibraries.us/files/original/d99d763c5a60d17afe606193e3fb0a86.pdf#page=1) | administrative_marker | Case Number: 2012-0798-F |
| 2 | [Open](https://clinton.presidentiallibraries.us/files/original/d99d763c5a60d17afe606193e3fb0a86.pdf#page=2) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 3 | [Open](https://clinton.presidentiallibraries.us/files/original/d99d763c5a60d17afe606193e3fb0a86.pdf#page=3) | withdrawal_marker | Withdrawal/Redaction Marker |

### clinton-v27-022 - Zimbabwe 1995 and Zimbabwe 1997 FOIA release packet

- Date: 1994-12-05
- Topic: Southern African Democracy, Health, and Economic Policy
- Catalog item: https://clinton.presidentiallibraries.us/items/show/14676
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf
- PDF pages: 6

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1 | [Open](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=1) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 2 | [Open](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=2) | released_or_context_text | President |
| 3 | [Open](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=3) | withdrawal_sheet | • t ' • • • • • • ' ' ' '""\'~.:~:'t;~ |
| 4 | [Open](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=4) | released_or_context_text | \' |
| 5-6 | [Open](https://clinton.presidentiallibraries.us/files/original/df4bb9956a0cbbcb0c924a11c321abd7.pdf#page=5) | released_document_text | FROM DEPARTMENT OF STATE 4A (THU) 11. 6' 97 16:53/ST. 16:53/NO. 3760637124 P 2 |

### clinton-v27-023 - Mugabe visit briefing packet and talking points

- Date: 1995-05-16
- Topic: Southern African Democracy, Health, and Economic Policy
- Catalog item: https://clinton.presidentiallibraries.us/items/show/14571
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf
- PDF pages: 157

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1-2 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=1) | withdrawal_sheet | ~------------------- |
| 3 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=3) | released_document_text | U NCLASSI FlED |
| 4-6 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=4) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 7 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=7) | released_or_context_text | ·-~ Ad~OOJ04dJ"J'['I l"!l"'P!'"d OO)O!J~ : " " , |
| 8 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=8) | withdrawal_sheet | ·Withdrawal/Redaction Sheet |
| 9-10 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=9) | released_document_text | "' 2FBB7B1 |
| 11 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=11) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 12 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=12) | released_document_text | MSMail |
| 13-14 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=13) | released_or_context_text | ______.3"'3c-.-1,..7nc87""'B"'~E....--...F"'"IN.....--------- ---- |
| 15 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=15) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 16-18 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=16) | released_document_text | - ---------------------------------------------,=:---:--::-:::----------. |
| 19-26 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=19) | released_or_context_text | 3300C8B6.FIN Page 2 of75 |
| 27 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=27) | released_document_text | 3300C8B6.FIN Page 10 of75 |
| 28-31 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=28) | released_or_context_text | 3300C8B6.FIN Page 11 of75 |
| 32 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=32) | released_document_text | 3300C8B6.FIN Page 15 of75 |
| 33-51 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=33) | released_or_context_text | 3300C8B6.FIN Page 16 of75 |
| 52 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=52) | released_document_text | ----------------------------------------------------------. |
| 53-54 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=53) | released_or_context_text | -~---------- |
| 55-57 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=55) | released_document_text | 3300C8B6.FIN Page 38 of75 |
| 58 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=58) | released_or_context_text | 3300C8B6.FIN Page 41 of75 |
| 59 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=59) | released_document_text | 3300C8B6.FIN Page 42 of75 |
| 60-73 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=60) | released_or_context_text | 3300C8B6.FIN Page 43 of75 |
| 74 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=74) | released_document_text | 3300C8B6.FIN Page 57 of75 |
| 75-79 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=75) | released_or_context_text | 3300C8B6.FIN Page 58 of75 |
| 80-81 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=80) | released_document_text | 3300C8B6.FIN Page 63 of75 |
| 82-89 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=82) | released_or_context_text | 3300C8B6.FIN Page 65 of75 |
| 90 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=90) | released_document_text | 3300C8B6.FIN Page 73 of75 |
| 91-92 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=91) | released_or_context_text | 3300C8B6.FIN Page 74 of75 |
| 93 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=93) | released_document_text | 33178560.FIN Page~. of3 |
| 94-95 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=94) | released_or_context_text | 33178560.FIN Page 2 of3 |
| 96 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=96) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 97 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=97) | released_document_text | 333IEAD8.FIN Page I of I |
| 98 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=98) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 99-102 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=99) | released_document_text | 349F97FC.FIN Page 1 of 5 |
| 103-104 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=103) | released_or_context_text | 349F97FC.FIN Page 5 of7 |
| 105 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=105) | blank_or_image_only | N |
| 106 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=106) | released_or_context_text | 34A75A98.FIN Page 4 of47 |
| 107-108 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=107) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 109-113 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=109) | released_document_text | 11D5FC3B.FIN Page 1 of2 |
| 114 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=114) | released_or_context_text | 11DC56DC.FIN |
| 115-120 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=115) | released_document_text | 11DC5CFB.FIN Page 1 of2 |
| 121 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=121) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 122-123 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=122) | released_document_text | 342B5BB7.FIN Page 1 of27 |
| 124-148 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=124) | released_or_context_text | 342B5BB7.FIN Page 3 of27 |
| 149 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=149) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 150 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=150) | released_document_text | Mrican/African-American Summit: Updated 7116/97 |
| 151 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=151) | released_or_context_text | African/African-American Summit: Updated 7/16/97 |
| 152 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=152) | released_document_text | African/African-American Summit: Updated 7/16/97 |
| 153-157 | [Open](https://clinton.presidentiallibraries.us/files/original/01e7249f204413bb4b0238dad64c408e.pdf#page=153) | released_or_context_text | Updated 7/16/97 |

### clinton-v27-030 - Mbeki AIDS controversy packet, part 2

- Date: 2000-04-03
- Topic: South Africa Transition and Bilateral Relations
- Catalog item: https://clinton.presidentiallibraries.us/items/show/64751
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf
- PDF pages: 61

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=1) | administrative_marker | Case Number: 2007-1550-F |
| 2-3 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=2) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 4-6 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=4) | withdrawal_marker | Withdrawal/Redaction Marker |
| 7 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=7) | blank_or_image_only | II |
| 8 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=8) | withdrawal_marker | Withdrawal/Redaction Marker |
| 9 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=9) | blank_or_image_only | No text signal |
| 10 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=10) | withdrawal_marker | Withdrawal/Redaction Marker |
| 11 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=11) | blank_or_image_only | B |
| 12 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=12) | withdrawal_marker | Withdrawal/Redaction Marker· |
| 13 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=13) | blank_or_image_only | c |
| 14 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=14) | withdrawal_marker | Withdrawal/Redaction Marker |
| 15 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=15) | blank_or_image_only | D |
| 16-17 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=16) | released_or_context_text | Tab D International AIDS Legislative Goals and Calendar |
| 18 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=18) | withdrawal_marker | Withdrawal/Redaction Marker |
| 19-24 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=19) | released_or_context_text | Daily Mail&Guardian: Open letter to Prcsicknt Mbcki hllp://www.mg.rn.za/mg/ncws/2000may I /9111ay-a 1cls. ht 111 I |
| 25 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=25) | withdrawal_marker | Withdrawal/Redaction Marker |
| 26 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=26) | released_document_text | ~ . '-- 7. APP. 2000 16: 07 AMERICAN CONSULATE P. l |
| 27 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=27) | released_or_context_text | 7.APP.2000 16:07 AMEPICAN CONSULATE |
| 28 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=28) | released_document_text | OFFICE OF THE VICE |
| 29-31 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=29) | released_or_context_text | LUZli4(5007 T-784 P 02/04 F-153 |
| 32 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=32) | withdrawal_marker | Withdrawal/Redaction Marker |
| 33 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=33) | released_document_text | Keenan,Josefine(Chris) (HEALTH) |
| 34-36 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=34) | released_or_context_text | 2. (U) AT THE REQUEST OF DEMOCRATIC PARTY (DP) MP |
| 37 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=37) | withdrawal_marker | Withdrawal/Redaction Marker |
| 38 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=38) | released_document_text | UNCLASSIFIED RECORD ID: 0002729 |
| 39 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=39) | released_or_context_text | +i.(). 0 0 |
| 40-41 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=40) | released_document_text | -· 7 3cc:~ii rlAS SEEN |
| 42 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=42) | withdrawal_marker | Withdrawal/Redaction Marker |
| 43-45 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=43) | released_document_text | NATIONAL SECURITY COUNCIL ID 0002373 |
| 46 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=46) | withdrawal_marker | Withdrawal/Redaction Marker |
| 47-48 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=47) | released_document_text | NATIONAL SECURITY COUNCIL ID 0002373 |
| 49 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=49) | withdrawal_marker | Withdrawal/Redaction Marker |
| 50 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=50) | released_document_text | Sandra Thurman 03/13/2000 12:00:24 PM |
| 51-61 | [Open](https://clinton.presidentiallibraries.us/files/original/26093367de952b94c544f7abc15c6c62.pdf#page=51) | released_or_context_text | > Mbeki's office Thursday, January 20. |

### clinton-v27-029 - Mbeki AIDS controversy packet, part 1

- Date: 2000-05-01
- Topic: South Africa Transition and Bilateral Relations
- Catalog item: https://clinton.presidentiallibraries.us/items/show/64750
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf
- PDF pages: 70

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=1) | administrative_marker | Case Number: 2007-1550-F |
| 2-3 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=2) | withdrawal_sheet | Withdrawal/Redaction Sheet |
| 4-6 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=4) | withdrawal_marker | Withdrawal/Redaction Marker |
| 7-8 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=7) | released_document_text | Keenan,Josefine(Chris) (HEALTH) |
| 9 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=9) | released_or_context_text | THE PRESIDENT OF SOUTH AFRICA HAD MADE SUCH FOOLISH |
| 10 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=10) | released_document_text | GENUINE CITIZENSHIP AT ALL LEVELS. HOW CAN IT BE ACHIEVED? |
| 11-12 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=11) | released_or_context_text | PRESIDENT MBEKI SAID: "BILLIONS AMONG THE LIVING STRUGGLE TO |
| 13-14 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=13) | released_document_text | .:. ....... |
| 15-16 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=15) | released_or_context_text | ....... |
| 17-19 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=17) | released_document_text | Is AIDS is different in Africa, as some claim? |
| 20-21 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=20) | released_or_context_text | JOURNALISTS, DIPLOMATS, AND NGO REPRESENTATIVES |
| 22 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=22) | released_document_text | ... |
| 23 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=23) | released_or_context_text | .. , . |
| 24 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=24) | released_document_text | DISEASE. MALARIA IS SECOND, AND AIDS IS THIRD. AIDS |
| 25 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=25) | released_or_context_text | ... ' .... |
| 26 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=26) | released_document_text | . |
| 27 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=27) | released_or_context_text | A GOVERNMENT PANEL WILL LEND CLARITY TO THE ISSUE OF |
| 28 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=28) | released_document_text | .. |
| 29 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=29) | released_or_context_text | ...... |
| 30-31 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=30) | withdrawal_marker | Withdrawal/Redaction Marker |
| 32 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=32) | released_document_text | I |
| 33-34 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=33) | released_or_context_text | • |
| 35 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=35) | released_document_text | ' -- |
| 36 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=36) | released_or_context_text | The Scientific Facts: b1s-s "1Jt\N( Vl'(V\ ~ ~ ~h ~l ll'lf.bi1. _ |
| 37 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=37) | released_document_text | p_ 1 |
| 38 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=38) | released_or_context_text | 2-19-1995 0:25AM FROM |
| 39 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=39) | released_document_text | THE WHITE HOUSE |
| 40-41 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=40) | released_or_context_text | The Scientific Facts: |
| 42-43 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=42) | withdrawal_marker | Withdrawal/Redaction Marker |
| 44 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=44) | released_document_text | Bernard, Kenneth W. (HEALTH) |
| 45 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=45) | released_or_context_text | NDF DID NOT ADDRESS THE ISSUE OF THE HEALTH RISKS |
| 46 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=46) | released_document_text | Keenan,Josefine(Chris) (HEALTH) |
| 47-49 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=47) | released_or_context_text | 2. (U) AT THE REQUEST OF DEMOCRATIC PARTY (DP) MP |
| 50 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=50) | released_document_text | .. ~ : :::~::::·;~,ENT HJ\S SEEN |
| 51-52 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=51) | released_or_context_text | ' ' I._ · |
| 53 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=53) | released_document_text | ... 3447 |
| 54-55 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=54) | released_or_context_text | The Scientific Pacts |
| 56-59 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=56) | withdrawal_marker | Withdrawal/Redaction Marker |
| 60 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=60) | released_document_text | S/S 200006886 |
| 61-62 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=61) | released_or_context_text | BL 1/USA/P/H4/04-04 |
| 63 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=63) | withdrawal_marker | Withdrawal/Redaction Marker |
| 64-66 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=64) | released_document_text | "'6Q~iIBENTIAL RECORD ID: 0002373 |
| 67-69 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=67) | released_or_context_text | <30V~RNMENT, ASSERTING THAT THE PRICE OF HIV/AIDS DRUGS |
| 70 | [Open](https://clinton.presidentiallibraries.us/files/original/21a9567fcf0c1490aa2ebcf893468b16.pdf#page=70) | withdrawal_marker | Withdrawal/Redaction Marker |

### clinton-v27-038 - MDR packet on Victor Butt/Bout arms trafficking and sub-Saharan Africa

- Date: 2000-10-01
- Topic: Angola, Mozambique, and Southern African Security
- Catalog item: https://clinton.presidentiallibraries.us/items/show/118505
- Direct PDF: https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf
- PDF pages: 98

| PDF pages | Open | First-pass role | First page signal |
| --- | --- | --- | --- |
| 1 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=1) | released_document_text | *ZvU v |
| 2-3 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=2) | released_or_context_text | 9. 20'00 16.16/ST 16.15/NO. 3700000434 F 3 |
| 4 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=4) | released_document_text | DECLASSIFIED IN PART |
| 5 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=5) | released_or_context_text | *• |
| 6-16 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=6) | released_document_text | V |
| 17 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=17) | released_or_context_text | Butt’s Firms EO 13526 1.4c |
| 18-21 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=18) | released_document_text | TOP SECRET DECLASSIFIED IN PART |
| 22-23 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=22) | released_or_context_text | C .to |
| 24-27 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=24) | released_document_text | V *- |
| 28 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=28) | released_or_context_text | , J |
| 29-32 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=29) | released_document_text | 5' 00 11 : 21/^531 :21/NO. 760626691 P 2 |
| 33 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=33) | released_or_context_text | TV |
| 34-35 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=34) | released_document_text | SECRET CLINTON LIBRARY PHOTOCOPY |
| 36-40 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=36) | released_or_context_text | 16:15/ST. 16:14/NO. 3700UUUl«iz r - |
| 41 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=41) | released_document_text | FROM DEPARTMENT OF STATE OPERATIONS CENTER (THU) 11. 9' 00 1 6 : 16/ST. 16 : 14/NO. 3700000142 F 8 |
| 42-46 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=42) | released_or_context_text | 16:16/ST. 16:14/NO. 3700000142 P 9 |
| 47-53 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=47) | released_document_text | J |
| 54-55 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=54) | released_or_context_text | FROM DEPARTMENT OF STATE 4B (WED) 10. 18’ 00 17:42/ST. 17:42/NO. 3760626352 F 5 |
| 56-67 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=56) | released_document_text | FROM CMN SITE 3A |
| 68 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=68) | released_or_context_text | ^SEERET-NOrORN |
| 69-72 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=69) | released_document_text | SECRET NOFORN |
| 73-74 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=73) | released_or_context_text | F:\Cable\Data Source\Cables\CD036\APR99\M3789079.html Page 2 of 7 |
| 75 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=75) | released_document_text | F:\Cable\Data Source\Cables\CD036\APR99\M3789079.html Page 4 of 7 |
| 76-78 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=76) | released_or_context_text | F:\Cable\Data Source\Cables\CD036\APR99\M3789079.html Page 5 of 7 |
| 79-83 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=79) | released_document_text | 39926535.FIN Page 1 of 6 |
| 84 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=84) | released_or_context_text | 39926535.FIN Page 6 of 6 |
| 85-90 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=85) | released_document_text | 39896ADE.FIN Page 1 of 5 |
| 91 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=91) | released_or_context_text | 39BBB8BF.FIN Page 2 of2 |
| 92 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=92) | released_document_text | 3^BBBD63.FIN Page 1 of2 |
| 93 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=93) | released_or_context_text | 32BBBD63.FIN Page 2 of2 |
| 94-98 | [Open](https://clinton.presidentiallibraries.us/files/original/1e4efdd7fac280c9490efa4b4fb0f9cd.pdf#page=94) | released_document_text | 39BBBAAE.FIN Page 1 of 5 |
