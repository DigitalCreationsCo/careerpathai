import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const markdown = body.markdown as string | undefined;
    if (!markdown) {
      return NextResponse.json({ error: 'Markdown content is required.' }, { status: 400 });
    }

    const { mdToPdf } = await import('md-to-pdf');

    const frontmatter = `---
pdf_options:
  format: a4
  margin: 30mm 20mm
  printBackground: true
  headerTemplate: |-
    <style>
      section {
        margin: 0 auto;
        font-family: system-ui;
        font-size: 11px;
      }
    </style>
    <section>
      <span class="title"></span>
      <span class="date"></span>
    </section>
  footerTemplate: |-
    <section>
      <div>
        Page <span class="pageNumber"></span>
        of <span class="totalPages"></span>
      </div>
    </section>
---
`;

    const markdownWithFrontmatter = `${frontmatter}\n${markdown}`;

    const pdf = await mdToPdf({ content: markdownWithFrontmatter });
    if (!pdf || !pdf.content) {
      return NextResponse.json({ error: 'Failed to generate PDF.' }, { status: 500 });
    }

    return new NextResponse(new Uint8Array(pdf.content), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error?.message || 'Unexpected error.' }, { status: 500 });
  }
}