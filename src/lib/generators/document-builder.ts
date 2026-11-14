import JSZip from 'jszip';

export interface SlideData {
  title: string;
  subtitle?: string;
  bullets?: string[];
  content?: string;
  notes?: string;
}

export interface PresentationData {
  title: string;
  theme?: 'modern' | 'dark' | 'corporate' | 'creative';
  author?: string;
  slides: SlideData[];
}

export interface DocumentSection {
  heading?: string;
  level?: 1 | 2 | 3;
  paragraphs?: string[];
  bullets?: string[];
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface WordDocumentData {
  title: string;
  subtitle?: string;
  author?: string;
  sections: DocumentSection[];
}

export interface SpreadsheetData {
  title: string;
  sheets: {
    name: string;
    headers: string[];
    rows: (string | number)[][];
  }[];
}

export interface WebsiteData {
  title: string;
  html: string;
  css?: string;
  js?: string;
  readme?: string;
}

/**
 * Generates an authentic, valid OpenXML PowerPoint presentation (.pptx)
 * that opens seamlessly in Microsoft PowerPoint, Google Slides, Keynote, and LibreOffice.
 */
export async function generatePptx(data: PresentationData): Promise<Blob> {
  const zip = new JSZip();

  const isDark = data.theme === 'dark';
  const bgColor = isDark ? '1A202C' : 'FFFFFF';
  const textColor = isDark ? 'FFFFFF' : '1A202C';
  const accentColor = isDark ? '6366F1' : '4F46E5';
  const subtextColor = isDark ? 'A0AEC0' : '4A5568';

  // [Content_Types].xml
  let contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`;

  data.slides.forEach((_, idx) => {
    contentTypes += `\n  <Override PartName="/ppt/slides/slide${idx + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
  });
  contentTypes += `\n</Types>`;
  zip.file('[Content_Types].xml', contentTypes);

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
  );

  // ppt/presentation.xml
  let sldIdLst = '';
  data.slides.forEach((_, idx) => {
    sldIdLst += `<p:sldId id="${256 + idx}" r:id="rId${idx + 2}"/>`;
  });

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${sldIdLst}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
  );

  // ppt/_rels/presentation.xml.rels
  let presRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>`;
  data.slides.forEach((_, idx) => {
    presRels += `\n  <Relationship Id="rId${idx + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${idx + 1}.xml"/>`;
  });
  presRels += `\n</Relationships>`;
  zip.file('ppt/_rels/presentation.xml.rels', presRels);

  // ppt/slideMasters/slideMaster1.xml
  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`
  );

  // ppt/slideMasters/_rels/slideMaster1.xml.rels
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
  );

  // ppt/slideLayouts/slideLayout1.xml
  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
</p:sldLayout>`
  );

  // ppt/slideLayouts/_rels/slideLayout1.xml.rels
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
  );

  // Build each slide
  data.slides.forEach((slide, idx) => {
    const isCover = idx === 0;
    const bulletsXml = (slide.bullets || [])
      .map(
        b => `<a:p>
          <a:pPr lvl="0" marL="288000"><a:buFont typeface="Arial"/><a:buChar char="•"/></a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="2000" dirty="0"><a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill></a:rPr>
            <a:t>${escapeXml(b)}</a:t>
          </a:r>
        </a:p>`
      )
      .join('');

    const slideContentXml = slide.content
      ? `<a:p>
          <a:pPr><a:spcBef><a:spcPts val="1200"/></a:spcBef></a:pPr>
          <a:r>
            <a:rPr lang="en-US" sz="1800"><a:solidFill><a:srgbClr val="${subtextColor}"/></a:solidFill></a:rPr>
            <a:t>${escapeXml(slide.content)}</a:t>
          </a:r>
        </a:p>`
      : '';

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="${bgColor}"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>

      <!-- Decorative Header Bar -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="DecoBar"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="914400" y="609600"/><a:ext cx="914400" cy="45720"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:solidFill><a:srgbClr val="${accentColor}"/></a:solidFill>
        </p:spPr>
      </p:sp>

      <!-- Slide Title -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="914400" y="${isCover ? '2286000' : '822960'}"/><a:ext cx="10363200" cy="${isCover ? '1600000' : '914400'}"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="${isCover ? '4400' : '3200'}" b="1">
                <a:solidFill><a:srgbClr val="${textColor}"/></a:solidFill>
              </a:rPr>
              <a:t>${escapeXml(slide.title)}</a:t>
            </a:r>
          </a:p>
          ${
            slide.subtitle
              ? `<a:p>
              <a:pPr><a:spcBef><a:spcPts val="800"/></a:spcBef></a:pPr>
              <a:r>
                <a:rPr lang="en-US" sz="2000">
                  <a:solidFill><a:srgbClr val="${accentColor}"/></a:solidFill>
                </a:rPr>
                <a:t>${escapeXml(slide.subtitle)}</a:t>
              </a:r>
            </a:p>`
              : ''
          }
        </p:txBody>
      </p:sp>

      <!-- Body / Bullets -->
      ${
        !isCover && (bulletsXml || slideContentXml)
          ? `<p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Content"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="914400" y="2057400"/><a:ext cx="10363200" cy="4114800"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:lstStyle/>
          ${bulletsXml}
          ${slideContentXml}
        </p:txBody>
      </p:sp>`
          : ''
      }

      <!-- Footer Badge -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="Footer"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="914400" y="6300000"/><a:ext cx="4000000" cy="300000"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1000"><a:solidFill><a:srgbClr val="${subtextColor}"/></a:solidFill></a:rPr>
              <a:t>DeployX AI • Slide ${idx + 1} of ${data.slides.length}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

    zip.file(`ppt/slides/slide${idx + 1}.xml`, slideXml);

    zip.file(
      `ppt/slides/_rels/slide${idx + 1}.xml.rels`,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
    );
  });

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}

/**
 * Generates an authentic, valid OpenXML Word document (.docx)
 * that opens seamlessly in Microsoft Word, Google Docs, Pages, and LibreOffice.
 */
export async function generateDocx(data: WordDocumentData): Promise<Blob> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/document.xml
  let bodyXml = '';

  // Title
  bodyXml += `<w:p>
    <w:pPr><w:jc w:val="left"/><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="48"/><w:color w:val="1A202C"/></w:rPr><w:t>${escapeXml(data.title)}</w:t></w:r>
  </w:p>`;

  if (data.subtitle) {
    bodyXml += `<w:p>
      <w:pPr><w:spacing w:after="240"/></w:pPr>
      <w:r><w:rPr><w:i/><w:sz w:val="24"/><w:color w:val="4A5568"/></w:rPr><w:t>${escapeXml(data.subtitle)}</w:t></w:r>
    </w:p>`;
  }

  // Sections
  data.sections.forEach(sec => {
    if (sec.heading) {
      const sz = sec.level === 1 ? '36' : sec.level === 2 ? '28' : '24';
      bodyXml += `<w:p>
        <w:pPr><w:spacing w:before="280" w:after="100"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="${sz}"/><w:color w:val="2D3748"/></w:rPr><w:t>${escapeXml(sec.heading)}</w:t></w:r>
      </w:p>`;
    }

    (sec.paragraphs || []).forEach(p => {
      bodyXml += `<w:p>
        <w:pPr><w:spacing w:after="140"/><w:ind w:left="0"/></w:pPr>
        <w:r><w:rPr><w:sz w:val="22"/><w:color w:val="2D3748"/></w:rPr><w:t>${escapeXml(p)}</w:t></w:r>
      </w:p>`;
    });

    (sec.bullets || []).forEach(b => {
      bodyXml += `<w:p>
        <w:pPr><w:spacing w:after="80"/><w:ind w:left="360"/></w:pPr>
        <w:r><w:rPr><w:sz w:val="22"/><w:color w:val="2D3748"/></w:rPr><w:t>• ${escapeXml(b)}</w:t></w:r>
      </w:p>`;
    });

    if (sec.table && sec.table.headers.length > 0) {
      bodyXml += `<w:tbl>
        <w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="CBD5E0"/><w:left w:val="none"/><w:bottom w:val="single" w:sz="4" w:color="CBD5E0"/><w:right w:val="none"/><w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/><w:insideV w:val="none"/></w:tblBorders></w:tblPr>`;

      // Header row
      bodyXml += `<w:tr><w:trPr><w:tblHeader/></w:trPr>`;
      sec.table.headers.forEach(h => {
        bodyXml += `<w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="EDF2F7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(h)}</w:t></w:r></w:p></w:tc>`;
      });
      bodyXml += `</w:tr>`;

      // Rows
      sec.table.rows.forEach(r => {
        bodyXml += `<w:tr>`;
        r.forEach(cell => {
          bodyXml += `<w:tc><w:p><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>${escapeXml(cell)}</w:t></w:r></w:p></w:tc>`;
        });
        bodyXml += `</w:tr>`;
      });
      bodyXml += `</w:tbl><w:p/>`;
    }
  });

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${bodyXml}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/**
 * Generates an authentic, valid OpenXML Excel spreadsheet (.xlsx)
 * with formatted cells, rows, and columns that opens in Excel and Google Sheets.
 */
export async function generateXlsx(data: SpreadsheetData): Promise<Blob> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // xl/workbook.xml
  zip.file(
    'xl/workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(data.sheets[0]?.name || 'Sheet1')}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // xl/_rels/workbook.xml.rels
  zip.file(
    'xl/_rels/workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // xl/styles.xml
  zip.file(
    'xl/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
  );

  // Sheet 1 data
  const sheet = data.sheets[0] || { name: 'Sheet1', headers: [], rows: [] };
  let sheetDataXml = '';

  // Header row
  if (sheet.headers && sheet.headers.length > 0) {
    sheetDataXml += `<row r="1">`;
    sheet.headers.forEach((h, colIdx) => {
      const colLetter = getColumnLetter(colIdx);
      sheetDataXml += `<c r="${colLetter}1" t="inlineStr" s="1"><is><t>${escapeXml(h)}</t></is></c>`;
    });
    sheetDataXml += `</row>`;
  }

  // Data rows
  sheet.rows.forEach((row, rowIdx) => {
    const rowNum = (sheet.headers.length > 0 ? 2 : 1) + rowIdx;
    sheetDataXml += `<row r="${rowNum}">`;
    row.forEach((cellVal, colIdx) => {
      const colLetter = getColumnLetter(colIdx);
      const isNum = typeof cellVal === 'number';
      if (isNum) {
        sheetDataXml += `<c r="${colLetter}${rowNum}"><v>${cellVal}</v></c>`;
      } else {
        sheetDataXml += `<c r="${colLetter}${rowNum}" t="inlineStr"><is><t>${escapeXml(String(cellVal))}</t></is></c>`;
      }
    });
    sheetDataXml += `</row>`;
  });

  zip.file(
    'xl/worksheets/sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetDataXml}</sheetData>
</worksheet>`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Packs website source files into a downloadable ZIP project.
 */
export async function generateWebsiteZip(data: WebsiteData): Promise<Blob> {
  const zip = new JSZip();

  zip.file('index.html', data.html);

  if (data.css) {
    zip.file('styles.css', data.css);
  }

  if (data.js) {
    zip.file('app.js', data.js);
  }

  zip.file(
    'README.md',
    data.readme ||
      `# ${data.title}\n\nBuilt with DeployX Autonomous AI Engineering Platform.\n\n## How to run:\nOpen \`index.html\` directly in any web browser.`
  );

  return await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
}

// Helpers
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColumnLetter(colIdx: number): string {
  let letter = '';
  let temp = colIdx;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}
